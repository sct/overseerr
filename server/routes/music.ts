import MusicBrainzAPI from '@server/api/musicbrainz';
import { MediaType } from '@server/constants/media';
import { getRepository } from '@server/datasource';
import Media from '@server/entity/Media';
import logger from '@server/logger';
import { isValidMBID, validatePagination } from '@server/utils/validation';
import { Router } from 'express';

const musicRoutes = Router();

musicRoutes.get('/artist/:mbid', async (req, res, next) => {
  const { mbid } = req.params;

  // Validate MBID format to prevent path traversal/injection
  if (!isValidMBID(mbid)) {
    return next({
      status: 400,
      message: 'Invalid MusicBrainz ID format.',
    });
  }

  const musicBrainz = new MusicBrainzAPI();

  try {
    const artist = await musicBrainz.getArtist(mbid, [
      'releases',
      'release-groups',
      'tags',
      'ratings',
    ]);

    const mediaRepository = getRepository(Media);
    const media = await mediaRepository.findOne({
      where: {
        musicBrainzId: mbid,
        mediaType: MediaType.ARTIST,
      },
      relations: ['requests'],
    });

    return res.status(200).json({
      id: artist.id,
      name: artist.name,
      sortName: artist['sort-name'],
      disambiguation: artist.disambiguation,
      country: artist.country,
      type: artist.type,
      area: artist.area,
      lifeSpan: artist['life-span'],
      tags: artist.tags || artist['tag-list'] || [],
      releaseGroups: artist['release-groups'] || [],
      mediaInfo: media,
    });
  } catch (e) {
    logger.debug('Something went wrong retrieving artist', {
      label: 'API',
      errorMessage: e.message,
      mbid,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve artist.',
    });
  }
});

musicRoutes.get('/artist/:mbid/albums', async (req, res, next) => {
  const { mbid } = req.params;

  // Validate MBID format to prevent path traversal/injection
  if (!isValidMBID(mbid)) {
    return next({
      status: 400,
      message: 'Invalid MusicBrainz ID format.',
    });
  }

  const musicBrainz = new MusicBrainzAPI();

  try {
    const { page, limit, offset } = validatePagination(
      typeof req.query.page === 'string' ? req.query.page : undefined,
      typeof req.query.limit === 'string' ? req.query.limit : undefined,
      100
    );

    const albums = await musicBrainz.getArtistAlbums(mbid, limit, offset);

    const mediaRepository = getRepository(Media);
    const musicBrainzIds =
      albums['release-group-list']?.map((rg) => rg.id) || [];
    const media = musicBrainzIds.length
      ? await mediaRepository.find({
          where: musicBrainzIds.map((mbid) => ({
            musicBrainzId: mbid,
            mediaType: MediaType.ALBUM,
          })),
        })
      : [];

    return res.status(200).json({
      page,
      totalPages: Math.ceil((albums.count || 0) / limit),
      totalResults: albums.count || 0,
      results: (albums['release-group-list'] || []).map((rg) => ({
        id: rg.id,
        title: rg.title,
        primaryType: rg['primary-type'],
        secondaryTypes: rg['secondary-types'] || [],
        firstReleaseDate: rg['first-release-date'],
        disambiguation: rg.disambiguation,
        artistCredit: rg['artist-credit'] || [],
        tags: rg.tags || rg['tag-list'] || [],
        mediaInfo: media.find((m) => m.musicBrainzId === rg.id),
      })),
    });
  } catch (e) {
    logger.debug('Something went wrong retrieving artist albums', {
      label: 'API',
      errorMessage: e.message,
      mbid,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve artist albums.',
    });
  }
});

musicRoutes.get('/album/:mbid', async (req, res, next) => {
  const { mbid } = req.params;

  // Validate MBID format to prevent path traversal/injection
  if (!isValidMBID(mbid)) {
    return next({
      status: 400,
      message: 'Invalid MusicBrainz ID format.',
    });
  }

  const musicBrainz = new MusicBrainzAPI();

  try {
    const releaseGroup = await musicBrainz.getReleaseGroup(mbid, [
      'artists',
      'releases',
      'tags',
      'ratings',
    ]);

    const mediaRepository = getRepository(Media);
    const media = await mediaRepository.findOne({
      where: {
        musicBrainzId: mbid,
        mediaType: MediaType.ALBUM,
      },
      relations: ['requests'],
    });

    return res.status(200).json({
      id: releaseGroup.id,
      title: releaseGroup.title,
      primaryType: releaseGroup['primary-type'],
      secondaryTypes: releaseGroup['secondary-types'] || [],
      firstReleaseDate: releaseGroup['first-release-date'],
      disambiguation: releaseGroup.disambiguation,
      artistCredit: releaseGroup['artist-credit'] || [],
      releases: releaseGroup.releases || [],
      tags: releaseGroup.tags || releaseGroup['tag-list'] || [],
      mediaInfo: media,
    });
  } catch (e) {
    logger.debug('Something went wrong retrieving album', {
      label: 'API',
      errorMessage: e.message,
      mbid,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve album.',
    });
  }
});

musicRoutes.get('/artist/:mbid/similar', async (req, res, next) => {
  const { mbid } = req.params;

  // Validate MBID format to prevent path traversal/injection
  if (!isValidMBID(mbid)) {
    return next({
      status: 400,
      message: 'Invalid MusicBrainz ID format.',
    });
  }

  const musicBrainz = new MusicBrainzAPI();

  try {
    // Get artist with relations to find similar artists
    const artist = await musicBrainz.getArtist(mbid, [
      'artist-relations',
      'url-relations',
    ]);

    const similarArtists: Array<{
      id: string;
      name: string;
      type?: string;
    }> = [];

    // Extract similar artists from relations
    if (artist.relations) {
      for (const relation of artist.relations) {
        // Look for collaboration, member, or similar relation types
        if (
          relation.type === 'collaboration' ||
          relation.type === 'member of band' ||
          relation.type === 'part of' ||
          relation.artist
        ) {
          if (relation.artist && relation.artist.id !== mbid) {
            similarArtists.push({
              id: relation.artist.id,
              name: relation.artist.name,
            });
          }
        }
      }
    }

    // If we don't have enough similar artists from relations, use tags to find similar
    if (similarArtists.length < 5 && artist.tags && artist.tags.length > 0) {
      const topTag = artist.tags
        .sort((a, b) => (b.count || 0) - (a.count || 0))[0];
      if (topTag) {
        const tagResults = await musicBrainz.searchArtists(
          `tag:${topTag.name}`,
          10,
          0
        );
        const tagArtists =
          tagResults['artist-list']?.filter((a) => a.id !== mbid) || [];
        for (const tagArtist of tagArtists.slice(0, 5 - similarArtists.length)) {
          if (!similarArtists.find((sa) => sa.id === tagArtist.id)) {
            similarArtists.push({
              id: tagArtist.id,
              name: tagArtist.name,
              type: tagArtist.type,
            });
          }
        }
      }
    }

    const mediaRepository = getRepository(Media);
    const musicBrainzIds = similarArtists.map((a) => a.id);
    const media = musicBrainzIds.length
      ? await mediaRepository.find({
          where: musicBrainzIds.map((mbid) => ({
            musicBrainzId: mbid,
            mediaType: MediaType.ARTIST,
          })),
        })
      : [];

    return res.status(200).json({
      results: similarArtists.map((artist) => ({
        id: artist.id,
        name: artist.name,
        type: artist.type,
        mediaInfo: media.find((m) => m.musicBrainzId === artist.id),
      })),
    });
  } catch (e) {
    logger.debug('Something went wrong retrieving similar artists', {
      label: 'API',
      errorMessage: e.message,
      mbid,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve similar artists.',
    });
  }
});

export default musicRoutes;
