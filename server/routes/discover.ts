import { Router } from 'express';
import TheMovieDb from '../api/themoviedb';
import { mapMovieResult, mapTvResult } from '../models/Search';
import Media from '../entity/Media';

const discoverRoutes = Router();

discoverRoutes.get('/movies', async (req, res) => {
  const tmdb = new TheMovieDb();

  const data = await tmdb.getDiscoverMovies({
    page: Number(req.query.page),
    language: req.query.language as string,
  });

  const media = await Media.getRelatedMedia(
    data.results.map((result) => result.id)
  );

  return res.status(200).json({
    page: data.page,
    totalPages: data.total_pages,
    totalResults: data.total_results,
    results: data.results.map((result) =>
      mapMovieResult(
        result,
        media.find((req) => req.tmdbId === result.id)
      )
    ),
  });
});

discoverRoutes.get('/tv', async (req, res) => {
  const tmdb = new TheMovieDb();

  const data = await tmdb.getDiscoverTv({
    page: Number(req.query.page),
    language: req.query.language as string,
  });

  const media = await Media.getRelatedMedia(
    data.results.map((result) => result.id)
  );

  return res.status(200).json({
    page: data.page,
    totalPages: data.total_pages,
    totalResults: data.total_results,
    results: data.results.map((result) =>
      mapTvResult(
        result,
        media.find((req) => req.tmdbId === result.id)
      )
    ),
  });
});

export default discoverRoutes;
