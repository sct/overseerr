import MusicBrainz from '@server/api/musicbrainz';
import TheMovieDb from '@server/api/themoviedb';
import type { TmdbSearchMultiResponse } from '@server/api/themoviedb/interfaces';
import Media from '@server/entity/Media';
import { findSearchProvider } from '@server/lib/search';
import logger from '@server/logger';
import type {
  MbSearchMultiResponse,
  MixedSearchResponse,
} from '@server/models/Search';
import { mapSearchResults } from '@server/models/Search';
import { Router } from 'express';

const searchRoutes = Router();

searchRoutes.get('/', async (req, res, next) => {
  console.time('search');
  const queryString = req.query.query as string;
  const searchProvider = findSearchProvider(queryString.toLowerCase());
  let results:
    | MixedSearchResponse
    | TmdbSearchMultiResponse
    | MbSearchMultiResponse;

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
      console.time('initTmdb');
      const tmdb = new TheMovieDb();
      console.timeEnd('initTmdb');
      console.time('searchMultiTmdb');
      results = await tmdb.searchMulti({
        query: queryString,
        page: Number(req.query.page),
        language: (req.query.language as string) ?? req.locale,
      });
      console.timeEnd('searchMultiTmdb');
      console.time('initMb');
      const mb = new MusicBrainz();
      console.timeEnd('initMb');
      console.time('searchMultiMb');
      const mbResults = await mb.searchMulti({
        query: queryString,
        page: Number(req.query.page),
      });
      console.timeEnd('searchMultiMb');
      const releaseResults = mbResults.releaseResults;
      const artistResults = mbResults.artistResults;
      console.time('mergeResults');
      results = {
        ...results,
        results: [...results.results, ...artistResults, ...releaseResults],
      };
      console.timeEnd('mergeResults');
    }
    console.time('getRelatedMedia');
    const mbIds = results.results
      .filter((result) => typeof result.id === 'string')
      .map((result) => result.id as string);

    const tmdbIds = results.results
      .filter((result) => typeof result.id === 'number')
      .map((result) => result.id as number);

    const media = await Media.getRelatedMedia(tmdbIds, mbIds);
    console.timeEnd('getRelatedMedia');
    console.time('mapSearchResults');
    const mappedResults = await mapSearchResults(results.results, media);
    console.timeEnd('mapSearchResults');
    console.timeEnd('search');
    return res.status(200).json({
      page: results.page,
      totalPages: results.total_pages,
      totalResults: results.total_results,
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
  try {
    if (!req.query.type || req.query.type !== 'music') {
      const tmdb = new TheMovieDb();
      const results = await tmdb.searchKeyword({
        query: req.query.query as string,
        page: Number(req.query.page),
      });

      return res.status(200).json(results);
    } else {
      const mb = new MusicBrainz();

      const results = await mb.searchTags(req.query.query as string);

      return res.status(200).json(results);
    }
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
