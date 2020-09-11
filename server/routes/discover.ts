import { Router } from 'express';
import TheMovieDb from '../api/themoviedb';
import { mapMovieResult, mapTvResult } from '../models/Search';

const discoverRoutes = Router();

discoverRoutes.get('/movies', async (req, res) => {
  const tmdb = new TheMovieDb();

  const data = await tmdb.getDiscoverMovies({ page: Number(req.query.page) });

  return res.status(200).json({
    page: data.page,
    totalPages: data.total_pages,
    totalResults: data.total_results,
    results: data.results.map(mapMovieResult),
  });
});

discoverRoutes.get('/tv', async (req, res) => {
  const tmdb = new TheMovieDb();

  const data = await tmdb.getDiscoverTv({ page: Number(req.query.page) });

  return res.status(200).json({
    page: data.page,
    totalPages: data.total_pages,
    totalResults: data.total_results,
    results: data.results.map(mapTvResult),
  });
});

export default discoverRoutes;
