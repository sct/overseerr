import { Router } from 'express';
import TheMovieDb from '../api/themoviedb';
import { mapSearchResults } from '../models/Search';

const searchRoutes = Router();

searchRoutes.get('/', async (req, res) => {
  const tmdb = new TheMovieDb();

  const results = await tmdb.searchMulti({
    query: req.query.query as string,
    page: Number(req.query.page),
  });

  return res.status(200).json({
    page: results.page,
    totalPages: results.total_pages,
    totalResults: results.total_results,
    results: mapSearchResults(results.results),
  });
});

export default searchRoutes;
