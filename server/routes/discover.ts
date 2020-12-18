import { Router } from 'express';
import TheMovieDb from '../api/themoviedb';
import { mapMovieResult, mapTvResult, mapPersonResult } from '../models/Search';
import Media from '../entity/Media';
import { isMovie, isPerson } from '../utils/typeHelpers';
import { MediaType } from '../constants/media';

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

discoverRoutes.get('/movies/upcoming', async (req, res) => {
  const tmdb = new TheMovieDb();

  const data = await tmdb.getUpcomingMovies({
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
        media.find(
          (med) => med.tmdbId === result.id && med.mediaType === MediaType.MOVIE
        )
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
        media.find(
          (med) => med.tmdbId === result.id && med.mediaType === MediaType.TV
        )
      )
    ),
  });
});

discoverRoutes.get('/trending', async (req, res) => {
  const tmdb = new TheMovieDb();

  const data = await tmdb.getAllTrending({
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
      isMovie(result)
        ? mapMovieResult(
            result,
            media.find(
              (req) =>
                req.tmdbId === result.id && req.mediaType === MediaType.MOVIE
            )
          )
        : isPerson(result)
        ? mapPersonResult(result)
        : mapTvResult(
            result,
            media.find((req) => req.tmdbId === result.id && MediaType.TV)
          )
    ),
  });
});

discoverRoutes.get<{ keywordId: string }>(
  '/keyword/:keywordId/movies',
  async (req, res) => {
    const tmdb = new TheMovieDb();

    const data = await tmdb.getMoviesByKeyword({
      keywordId: Number(req.params.keywordId),
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
          media.find(
            (req) =>
              req.tmdbId === result.id && req.mediaType === MediaType.MOVIE
          )
        )
      ),
    });
  }
);

export default discoverRoutes;
