import TheMovieDb from '@server/api/themoviedb';
import type { TmdbSearchMultiResponse } from '@server/api/themoviedb/interfaces';
import Media from '@server/entity/Media';
import { findSearchProvider } from '@server/lib/search';
import logger from '@server/logger';
import { mapSearchResults } from '@server/models/Search';
import { Router } from 'express';
import { User } from '@server/entity/User';

const filterResultsByRating = (results: any[], user?: User): any[] => {
  if (!user?.settings?.maxMovieRating && !user?.settings?.maxTvRating) {
    return results;
  }

  return results.filter((result: any) => {
    if (!user?.settings) return true;

    const isMovie = result.media_type === 'movie' || (!result.media_type && result.title);
    
    // Movie filtering based on admin setting
    if (isMovie && user.settings.maxMovieRating) {
      const maxRating = user.settings.maxMovieRating;
      
      // Apply blocking logic based on the setting:
      // "G" = block everything except G
      // "PG" = block PG and above (allow only G)
      // "PG-13" = block PG-13 and above (allow G, PG)
      // "R" = block R and above (allow G, PG, PG-13)
      // "Adult" = block only Adult/XXX (allow all standard ratings)
      
      // Always block adult content unless no restrictions
      if (result.adult && maxRating !== '') {
        return false;
      }
      
      // Use genre-based heuristics to filter content since certification data is unreliable
      const genreIds = result.genre_ids || [];
      
      if (maxRating === 'G') {
        // Block PG and above - very restrictive
        // Block: Action, Adventure, Thriller, Horror, Crime, War, Western
        if (genreIds.some((id: number) => [28, 12, 53, 27, 80, 10752, 37].includes(id))) {
          return false;
        }
      }
      
      if (maxRating === 'PG') {
        // Block PG-13 and above - moderately restrictive
        // Block: Thriller, Horror, Crime, War
        if (genreIds.some((id: number) => [53, 27, 80, 10752].includes(id))) {
          return false;
        }
      }
      
      if (maxRating === 'PG-13') {
        // Block R and above - less restrictive
        // Block: Horror, very violent content
        if (genreIds.some((id: number) => [27].includes(id))) {
          return false;
        }
      }
      
      if (maxRating === 'R') {
        // Block only Adult/XXX content
        // This is handled by the adult content check above
      }
      
      if (maxRating === 'Adult') {
        // Block only XXX adult content
        // This is the most permissive setting
        // Most content should pass through
      }
    }

    return true;
  });
};


const searchRoutes = Router();

searchRoutes.get('/', async (req, res, next) => {
  const queryString = req.query.query as string;
  const searchProvider = findSearchProvider(queryString.toLowerCase());
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

      results = await tmdb.searchMulti({
        query: queryString,
        page: Number(req.query.page),
        language: (req.query.language as string) ?? req.locale,
      });
    }

    const media = await Media.getRelatedMedia(
      results.results.map((result) => result.id)
    );

    return res.status(200).json({
      page: results.page,
      totalPages: results.total_pages,
      totalResults: results.total_results,
      results: mapSearchResults(results.results, media),
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
