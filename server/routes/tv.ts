import { Router } from 'express';
import TheMovieDb from '../api/themoviedb';
import { MediaRequest } from '../entity/MediaRequest';
import { mapTvDetails } from '../models/Tv';
import { mapTvResult } from '../models/Search';

const tvRoutes = Router();

tvRoutes.get('/:id', async (req, res) => {
  const tmdb = new TheMovieDb();

  const tv = await tmdb.getTvShow({
    tvId: Number(req.params.id),
    language: req.query.language as string,
  });

  const request = await MediaRequest.getRequest(tv.id);

  return res.status(200).json(mapTvDetails(tv, request));
});

tvRoutes.get('/:id/recommendations', async (req, res) => {
  const tmdb = new TheMovieDb();

  const results = await tmdb.getTvRecommendations({
    tvId: Number(req.params.id),
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
      mapTvResult(
        result,
        requests.find((req) => req.mediaId === result.id)
      )
    ),
  });
});

tvRoutes.get('/:id/similar', async (req, res) => {
  const tmdb = new TheMovieDb();

  const results = await tmdb.getTvSimilar({
    tvId: Number(req.params.id),
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
      mapTvResult(
        result,
        requests.find((req) => req.mediaId === result.id)
      )
    ),
  });
});

export default tvRoutes;
