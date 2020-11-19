import { Router } from 'express';
import TheMovieDb from '../api/themoviedb';
import { MediaRequest } from '../entity/MediaRequest';
import { mapTvDetails, mapSeasonWithEpisodes } from '../models/Tv';
import { mapTvResult } from '../models/Search';
import Media from '../entity/Media';
import RottenTomatoes from '../api/rottentomatoes';

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

tvRoutes.get('/:id/season/:seasonNumber', async (req, res) => {
  const tmdb = new TheMovieDb();

  const season = await tmdb.getTvSeason({
    tvId: Number(req.params.id),
    seasonNumber: Number(req.params.seasonNumber),
    language: req.query.language as string,
  });

  return res.status(200).json(mapSeasonWithEpisodes(season));
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

tvRoutes.get('/:id/ratings', async (req, res, next) => {
  const tmdb = new TheMovieDb();
  const rtapi = new RottenTomatoes();

  const tv = await tmdb.getTvShow({
    tvId: Number(req.params.id),
  });

  if (!tv) {
    return next({ status: 404, message: 'TV Show does not exist' });
  }

  const rtratings = await rtapi.getTVRatings(
    tv.name,
    Number(tv.first_air_date.slice(0, 4))
  );

  if (!rtratings) {
    return next({ status: 404, message: 'Unable to retrieve ratings' });
  }

  return res.status(200).json(rtratings);
});

export default tvRoutes;
