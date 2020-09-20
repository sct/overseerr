import { Router } from 'express';
import TheMovieDb from '../api/themoviedb';
import { MediaRequest } from '../entity/MediaRequest';
import { mapTvDetails } from '../models/Tv';
import { mapTvResult } from '../models/Search';
import Media from '../entity/Media';

const tvRoutes = Router();

tvRoutes.get('/:id', async (req, res) => {
  const tmdb = new TheMovieDb();

  const tv = await tmdb.getTvShow({
    tvId: Number(req.params.id),
    language: req.query.language as string,
  });

  const media = await Media.getMedia(tv.id);

  return res.status(200).json(mapTvDetails(tv, media));
});

tvRoutes.get('/:id/recommendations', async (req, res) => {
  const tmdb = new TheMovieDb();

  const results = await tmdb.getTvRecommendations({
    tvId: Number(req.params.id),
    page: Number(req.query.page),
    language: req.query.language as string,
  });

  const media = await Media.getRelatedMedia(
    results.results.map((result) => result.id)
  );

  return res.status(200).json({
    page: results.page,
    totalPages: results.total_pages,
    totalResults: results.total_results,
    results: results.results.map((result) =>
      mapTvResult(
        result,
        media.find((req) => req.tmdbId === result.id)
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

  const media = await Media.getRelatedMedia(
    results.results.map((result) => result.id)
  );

  return res.status(200).json({
    page: results.page,
    totalPages: results.total_pages,
    totalResults: results.total_results,
    results: results.results.map((result) =>
      mapTvResult(
        result,
        media.find((req) => req.tmdbId === result.id)
      )
    ),
  });
});

export default tvRoutes;
