import { Router } from 'express';
import TheMovieDb from '../api/themoviedb';
import { mapSearchResults } from '../models/Search';
import { MediaRequest } from '../entity/MediaRequest';

const searchRoutes = Router();

searchRoutes.get('/', async (req, res) => {
  const tmdb = new TheMovieDb();

  const results = await tmdb.searchMulti({
    query: req.query.query as string,
    page: Number(req.query.page),
  });

  const requests = await MediaRequest.getRelatedRequests(
    results.results.map((result) => result.id)
  );

  return res.status(200).json({
    page: results.page,
    totalPages: results.total_pages,
    totalResults: results.total_results,
    results: mapSearchResults(results.results, requests),
  });
});

export default searchRoutes;
