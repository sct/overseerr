import MusicBrainz from '@server/api/musicbrainz';
import { MediaType } from '@server/constants/media';
import Media from '@server/entity/Media';
import logger from '@server/logger';
import {
  mapArtistResult,
  mapReleaseGroupResult,
  mapReleaseResult,
} from '@server/models/Search';
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

    for (const release of results.releases) {
      release.mediaInfo = await Media.getMedia(release.id, MediaType.MUSIC);
    }

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

musicRoutes.get('/release-group/:id', async (req, res, next) => {
  const mb = new MusicBrainz();

  try {
    const releaseGroup = await mb.getReleaseGroup(req.params.id);

    const media = await Media.getMedia(releaseGroup.id, MediaType.MUSIC);

    const results = await mapReleaseGroupResult(releaseGroup, media);

    for (const release of results.releases) {
      release.mediaInfo = await Media.getMedia(release.id, MediaType.MUSIC);
    }

    return res.status(200).json(results);
  } catch (e) {
    logger.debug('Something went wrong retrieving release group', {
      label: 'API',
      errorMessage: e.message,
      releaseGroupId: req.params.id,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve release group.',
    });
  }
});

export default musicRoutes;
