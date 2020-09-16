import { Router } from 'express';
import TheMovieDb from '../api/themoviedb';
import { mapMovieDetails } from '../models/Movie';
import { MediaRequest } from '../entity/MediaRequest';

const movieRoutes = Router();

movieRoutes.get('/:id', async (req, res) => {
  const tmdb = new TheMovieDb();

  const movie = await tmdb.getMovie({ movieId: Number(req.params.id) });

  const request = await MediaRequest.getRequest(movie.id);

  return res.status(200).json(mapMovieDetails(movie, request));
});

export default movieRoutes;
