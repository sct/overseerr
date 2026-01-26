import TheMovieDb from '@server/api/themoviedb';
import type { TmdbSearchMultiResponse } from '@server/api/themoviedb/interfaces';
import Media from '@server/entity/Media';
import { findSearchProvider } from '@server/lib/search';
import logger from '@server/logger';
import { mapSearchResults } from '@server/models/Search';
import { Router } from 'express';

const searchRoutes = Router();

searchRoutes.get('/', async (req, res, next) => {
  const queryString = req.query.query as string;
  const searchProvider = findSearchProvider(queryString.toLowerCase());
  const year = req.query.year ? Number(req.query.year) : undefined;
  const genre = req.query.genre ? Number(req.query.genre) : undefined;
  const mediaType = req.query.mediaType as 'movie' | 'tv' | undefined;
  const status = req.query.status as string | undefined;
  let results: TmdbSearchMultiResponse;

  try {
    if (searchProvider) {
      const [id] = queryString
        .toLowerCase()
        .match(searchProvider.pattern) as RegExpMatchArray;
      results = await searchProvider.search({
        id,
        language: (req.query.language as string) ?? req.locale,
        query: queryString,
      });
    } else {
      const tmdb = new TheMovieDb();

      // Use type-specific search if filters are applied
      if (mediaType === 'movie' && (year || genre)) {
        const movieResults = await tmdb.searchMovies({
          query: queryString,
          page: Number(req.query.page) || 1,
          language: (req.query.language as string) ?? req.locale,
          year,
        });
        results = {
          ...movieResults,
          results: movieResults.results.map((r) => ({ ...r, media_type: 'movie' })),
        } as TmdbSearchMultiResponse;
      } else if (mediaType === 'tv' && (year || genre)) {
        const tvResults = await tmdb.searchTvShows({
          query: queryString,
          page: Number(req.query.page) || 1,
          language: (req.query.language as string) ?? req.locale,
          year,
        });
        results = {
          ...tvResults,
          results: tvResults.results.map((r) => ({ ...r, media_type: 'tv' })),
        } as TmdbSearchMultiResponse;
      } else {
        results = await tmdb.searchMulti({
          query: queryString,
          page: Number(req.query.page) || 1,
          language: (req.query.language as string) ?? req.locale,
        });
      }
    }

    const media = await Media.getRelatedMedia(
      results.results.map((result) => result.id)
    );

    let mappedResults = mapSearchResults(results.results, media);

    // Filter by genre if specified
    if (genre) {
      mappedResults = mappedResults.filter((result) => {
        if (
          (result.mediaType === 'movie' || result.mediaType === 'tv') &&
          'genreIds' in result &&
          Array.isArray(result.genreIds)
        ) {
          return result.genreIds.includes(genre);
        }
        return false;
      });
    }

    // Filter by availability status if specified
    if (status) {
      mappedResults = mappedResults.filter((result) => {
        if (
          (result.mediaType === 'movie' || result.mediaType === 'tv') &&
          result.mediaInfo
        ) {
          return result.mediaInfo.status === Number(status);
        }
        return status === '0'; // Unknown/unavailable
      });
    }

    return res.status(200).json({
      page: results.page,
      totalPages: results.total_pages,
      totalResults: mappedResults.length,
      results: mappedResults,
    });
  } catch (e) {
    logger.debug('Something went wrong retrieving search results', {
      label: 'API',
      errorMessage: e.message,
      query: req.query.query,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve search results.',
    });
  }
});

searchRoutes.get('/keyword', async (req, res, next) => {
  const tmdb = new TheMovieDb();

  try {
    const results = await tmdb.searchKeyword({
      query: req.query.query as string,
      page: Number(req.query.page),
    });

    return res.status(200).json(results);
  } catch (e) {
    logger.debug('Something went wrong retrieving keyword search results', {
      label: 'API',
      errorMessage: e.message,
      query: req.query.query,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve keyword search results.',
    });
  }
});

searchRoutes.get('/company', async (req, res, next) => {
  const tmdb = new TheMovieDb();

  try {
    const results = await tmdb.searchCompany({
      query: req.query.query as string,
      page: Number(req.query.page),
    });

    return res.status(200).json(results);
  } catch (e) {
    logger.debug('Something went wrong retrieving company search results', {
      label: 'API',
      errorMessage: e.message,
      query: req.query.query,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve company search results.',
    });
  }
});

export default searchRoutes;
