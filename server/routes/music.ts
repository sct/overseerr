import MusicBrainz from '@server/api/musicbrainz';
import { MediaType } from '@server/constants/media';
import Media from '@server/entity/Media';
import logger from '@server/logger';
import { mapArtistResult } from '@server/models/Search';
import { Router } from 'express';

const musicRoutes = Router();

musicRoutes.get('/artist/:id', async (req, res, next) => {
  const mb = new MusicBrainz();

  try {
    const artist = await mb.getArtist(req.params.id);

    const media = await Media.getMedia(artist.id, MediaType.MUSIC);

    return res.status(200).json(mapArtistResult(artist, media));
  } catch (e) {
    logger.debug('Something went wrong retrieving movie', {
      label: 'API',
      errorMessage: e.message,
      movieId: req.params.id,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve movie.',
    });
  }
});

export default musicRoutes;
