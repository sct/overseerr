import { Router } from 'express';
import TheMovieDb from '../api/themoviedb';
import { mapMovieDetails } from '../models/Movie';
import { MediaRequest } from '../entity/MediaRequest';
import { mapMovieResult } from '../models/Search';

const movieRoutes = Router();

movieRoutes.get('/:id', async (req, res) => {
  const tmdb = new TheMovieDb();

  const movie = await tmdb.getMovie({
    movieId: Number(req.params.id),
    language: req.query.language as string,
  });

  const request = await MediaRequest.getRequest(movie.id);

  return res.status(200).json(mapMovieDetails(movie, request));
});

movieRoutes.get('/:id/recommendations', async (req, res) => {
  const tmdb = new TheMovieDb();

  const results = await tmdb.getMovieRecommendations({
    movieId: Number(req.params.id),
    page: Number(req.query.page),
    language: req.query.language as string,
  });

  const requests = await MediaRequest.getRelatedRequests(
    results.results.map((result) => result.id)
  );

  return res.status(200).json({
    page: results.page,
    totalPages: results.total_pages,
    totalResults: results.total_results,
    results: results.results.map((result) =>
      mapMovieResult(
        result,
        requests.find((req) => req.mediaId === result.id)
      )
    ),
  });
});

movieRoutes.get('/:id/similar', async (req, res) => {
  const tmdb = new TheMovieDb();

  const results = await tmdb.getMovieSimilar({
    movieId: Number(req.params.id),
    page: Number(req.query.page),
    language: req.query.language as string,
  });

  const requests = await MediaRequest.getRelatedRequests(
    results.results.map((result) => result.id)
  );

  return res.status(200).json({
    page: results.page,
    totalPages: results.total_pages,
    totalResults: results.total_results,
    results: results.results.map((result) =>
      mapMovieResult(
        result,
        requests.find((req) => req.mediaId === result.id)
      )
    ),
  });
});

export default movieRoutes;
