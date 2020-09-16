import { Router } from 'express';
import TheMovieDb from '../api/themoviedb';
import { MediaRequest } from '../entity/MediaRequest';
import { mapTvDetails } from '../models/Tv';

const tvRoutes = Router();

tvRoutes.get('/:id', async (req, res) => {
  const tmdb = new TheMovieDb();

  const tv = await tmdb.getTvShow({ tvId: Number(req.params.id) });

  const request = await MediaRequest.getRequest(tv.id);

  return res.status(200).json(mapTvDetails(tv, request));
});

export default tvRoutes;
