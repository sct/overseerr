import RottenTomatoes from '@server/api/rating/rottentomatoes';
import TheMovieDb from '@server/api/themoviedb';
import { MediaType } from '@server/constants/media';
import Media from '@server/entity/Media';
import logger from '@server/logger';
import { mapTvResult } from '@server/models/Search';
import { mapSeasonWithEpisodes, mapTvDetails } from '@server/models/Tv';
import { toPositiveInteger } from '@server/utils/validation';
import { Router } from 'express';

const tvRoutes = Router();

tvRoutes.get('/:id', async (req, res, next) => {
  const tmdb = new TheMovieDb();
  try {
    const tvId = toPositiveInteger(req.params.id);
    if (!tvId) {
      return next({
        status: 400,
        message: 'Invalid TV series ID.',
      });
    }

    const tv = await tmdb.getTvShow({
      tvId,
      language: (req.query.language as string) ?? req.locale,
    });

    const media = await Media.getMedia(tv.id, MediaType.TV);

    return res.status(200).json(mapTvDetails(tv, media));
  } catch (e) {
    logger.debug('Something went wrong retrieving series', {
      label: 'API',
      errorMessage: e.message,
      tvId: req.params.id,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve series.',
    });
  }
});

tvRoutes.get('/:id/season/:seasonNumber', async (req, res, next) => {
  const tmdb = new TheMovieDb();

  try {
    const tvId = toPositiveInteger(req.params.id);
    const seasonNumber = toPositiveInteger(req.params.seasonNumber);
    
    if (!tvId) {
      return next({
        status: 400,
        message: 'Invalid TV series ID.',
      });
    }
    
    if (!seasonNumber) {
      return next({
        status: 400,
        message: 'Invalid season number.',
      });
    }

    const season = await tmdb.getTvSeason({
      tvId,
      seasonNumber,
      language: (req.query.language as string) ?? req.locale,
    });

    return res.status(200).json(mapSeasonWithEpisodes(season));
  } catch (e) {
    logger.debug('Something went wrong retrieving season', {
      label: 'API',
      errorMessage: e.message,
      tvId: req.params.id,
      seasonNumber: req.params.seasonNumber,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve season.',
    });
  }
});

tvRoutes.get('/:id/recommendations', async (req, res, next) => {
  const tmdb = new TheMovieDb();

  try {
    const tvId = toPositiveInteger(req.params.id);
    if (!tvId) {
      return next({
        status: 400,
        message: 'Invalid TV series ID.',
      });
    }

    const page = toPositiveInteger(
      typeof req.query.page === 'string' ? req.query.page : undefined
    ) ?? 1;

    const results = await tmdb.getTvRecommendations({
      tvId,
      page,
      language: (req.query.language as string) ?? req.locale,
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
          media.find(
            (req) => req.tmdbId === result.id && req.mediaType === MediaType.TV
          )
        )
      ),
    });
  } catch (e) {
    logger.debug('Something went wrong retrieving series recommendations', {
      label: 'API',
      errorMessage: e.message,
      tvId: req.params.id,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve series recommendations.',
    });
  }
});

tvRoutes.get('/:id/similar', async (req, res, next) => {
  const tmdb = new TheMovieDb();

  try {
    const tvId = toPositiveInteger(req.params.id);
    if (!tvId) {
      return next({
        status: 400,
        message: 'Invalid TV series ID.',
      });
    }

    const page = toPositiveInteger(
      typeof req.query.page === 'string' ? req.query.page : undefined
    ) ?? 1;

    const results = await tmdb.getTvSimilar({
      tvId,
      page,
      language: (req.query.language as string) ?? req.locale,
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
          media.find(
            (req) => req.tmdbId === result.id && req.mediaType === MediaType.TV
          )
        )
      ),
    });
  } catch (e) {
    logger.debug('Something went wrong retrieving similar series', {
      label: 'API',
      errorMessage: e.message,
      tvId: req.params.id,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve similar series.',
    });
  }
});

tvRoutes.get('/:id/ratings', async (req, res, next) => {
  const tmdb = new TheMovieDb();
  const rtapi = new RottenTomatoes();

  try {
    const tvId = toPositiveInteger(req.params.id);
    if (!tvId) {
      return next({
        status: 400,
        message: 'Invalid TV series ID.',
      });
    }

    const tv = await tmdb.getTvShow({
      tvId,
    });

    const rtratings = await rtapi.getTVRatings(
      tv.name,
      tv.first_air_date ? Number(tv.first_air_date.slice(0, 4)) : undefined
    );

    if (!rtratings) {
      return next({
        status: 404,
        message: 'Rotten Tomatoes ratings not found.',
      });
    }

    return res.status(200).json(rtratings);
  } catch (e) {
    logger.debug('Something went wrong retrieving series ratings', {
      label: 'API',
      errorMessage: e.message,
      tvId: req.params.id,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve series ratings.',
    });
  }
});

export default tvRoutes;
