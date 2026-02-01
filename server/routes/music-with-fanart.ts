import FanartAPI from '@server/api/fanart';
import { getLastFmArtistInfoByMbid, pickLastFmImage } from '@server/api/lastfm';
import MusicBrainzAPI from '@server/api/musicbrainz';
import { MediaType } from '@server/constants/media';
import { getRepository } from '@server/datasource';
import Media from '@server/entity/Media';
import logger from '@server/logger';
import { isValidMBID, validatePagination } from '@server/utils/validation';
import { Router } from 'express';

const musicRoutes = Router();
const fanart = new FanartAPI();

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

    // Optional Fanart.tv enrichment (HD images). Safe to ignore on failure.
    let fanartThumbnail: string | undefined;
    let fanartLogo: string | undefined;
    let fanartBackground: string | undefined;
    try {
      if (fanart.isConfigured()) {
        const fanartImages = await fanart.getArtistImagesByMbid(mbid);
        fanartThumbnail = fanart.pickArtistThumbnail(fanartImages, true);
        fanartLogo = fanart.pickArtistLogo(fanartImages, true);
        fanartBackground = fanart.pickArtistBackground(fanartImages);
      }
    } catch (e) {
      // fanart is optional, ignore errors
    }

    // Optional Last.fm enrichment (images/bio). Safe to ignore on failure.
    let lastFmImage: string | undefined;
    let lastFmBio: string | undefined;
    try {
      const lastfm = await getLastFmArtistInfoByMbid(mbid);
      lastFmImage = pickLastFmImage(lastfm);
      lastFmBio = lastfm?.bio?.summary || lastfm?.bio?.content;
    } catch (e) {
      // no-op
    }

    return res.status(200).json({
      id: artist.id,
      name: artist.name,
      // Prefer fanart HD images, fallback to Last.fm
      imageUrl: fanartThumbnail || lastFmImage,
      fanartThumbnail,
      fanartLogo,
      fanartBackground,
      bio: lastFmBio,
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

// Rest of file continues unchanged...
