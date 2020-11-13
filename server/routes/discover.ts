import { Router } from 'express';
import TheMovieDb, {
  TmdbMovieResult,
  TmdbTvResult,
  TmdbPersonResult,
} from '../api/themoviedb';
import { mapMovieResult, mapTvResult, mapPersonResult } from '../models/Search';
import Media from '../entity/Media';

const isMovie = (
  movie: TmdbMovieResult | TmdbTvResult | TmdbPersonResult
): movie is TmdbMovieResult => {
  return (movie as TmdbMovieResult).title !== undefined;
};

const isPerson = (
  person: TmdbMovieResult | TmdbTvResult | TmdbPersonResult
): person is TmdbPersonResult => {
  return (person as TmdbPersonResult).known_for !== undefined;
};

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
            media.find((req) => req.tmdbId === result.id)
          )
        : isPerson(result)
        ? mapPersonResult(result)
        : mapTvResult(
            result,
            media.find((req) => req.tmdbId === result.id)
          )
    ),
  });
});

export default discoverRoutes;
