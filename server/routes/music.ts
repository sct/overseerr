import MusicBrainz from '@server/api/musicbrainz';
import { MediaType, SecondaryType } from '@server/constants/media';
import Media from '@server/entity/Media';
import logger from '@server/logger';
import type { ReleaseResult } from '@server/models/Search';
import { mapArtistResult, mapReleaseResult } from '@server/models/Search';
import { Router } from 'express';

const musicRoutes = Router();

musicRoutes.get('/artist/:id', async (req, res, next) => {
  const mb = new MusicBrainz();

  try {
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const maxElements = req.query.maxElements
      ? parseInt(req.query.maxElements as string)
      : 25;
    const artist = req.query.full
      ? await mb.getFullArtist(req.params.id, maxElements, offset)
      : await mb.getArtist(req.params.id);

    const media = await Media.getMedia(artist.id, MediaType.MUSIC);

    const results = await mapArtistResult(artist, media);

    let existingReleaseMedia: Media[] = [];
    if (media) {
      existingReleaseMedia =
        (await Media.getChildMedia(Number(media.ratingKey) ?? 0)) ?? [];
    }

    let newReleases: ReleaseResult[] = await Promise.all(
      existingReleaseMedia.map(async (releaseMedia) => {
        return await mapReleaseResult(
          {
            id: <string>releaseMedia.mbId,
            media_type: SecondaryType.RELEASE,
            title: <string>releaseMedia.title,
            artist: [],
            tags: [],
          },
          releaseMedia
        );
      })
    );
    newReleases = newReleases.slice(offset, offset + maxElements);

    for (const release of results.releases) {
      if (newReleases.length >= maxElements) {
        break;
      }
      if (newReleases.find((r: ReleaseResult) => r.id === release.id)) {
        continue;
      }
      if (newReleases.find((r: ReleaseResult) => r.title === release.title)) {
        if (
          newReleases.find(
            (r: ReleaseResult) => r.mediaInfo && !release.mediaInfo
          )
        ) {
          continue;
        }
        if (
          newReleases.find(
            (r: ReleaseResult) => !r.mediaInfo && !release.mediaInfo
          )
        ) {
          continue;
        }
      }
      newReleases.push(release);
    }

    results.releases = newReleases;

    return res.status(200).json(results);
  } catch (e) {
    logger.debug('Something went wrong retrieving artist', {
      label: 'API',
      errorMessage: e.message,
      artistId: req.params.id,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve artist.',
    });
  }
});

musicRoutes.get('/release/:id', async (req, res, next) => {
  const mb = new MusicBrainz();

  try {
    const release = await mb.getRelease(req.params.id);

    const media = await Media.getMedia(release.id, MediaType.MUSIC);

    return res.status(200).json(await mapReleaseResult(release, media));
  } catch (e) {
    logger.debug('Something went wrong retrieving release', {
      label: 'API',
      errorMessage: e.message,
      releaseId: req.params.id,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve release.',
    });
  }
});

export default musicRoutes;
