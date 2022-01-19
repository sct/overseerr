import { Router } from 'express';
import TheMovieDb from '../api/themoviedb';
import { TmdbSearchMultiResponse } from '../api/themoviedb/interfaces';
import Media from '../entity/Media';
import { findSearchProvider } from '../lib/search';
import { mapSearchResults } from '../models/Search';

const searchRoutes = Router();

searchRoutes.get('/', async (req, res) => {
  const queryString = req.query.query as string;
  const searchProvider = findSearchProvider(queryString.toLowerCase());
  let results: TmdbSearchMultiResponse;

  if (searchProvider) {
    const [id] = queryString
      .toLowerCase()
      .match(searchProvider.pattern) as RegExpMatchArray;
    results = await searchProvider.search(
      id,
      req.locale ?? (req.query.language as string)
    );
  } else {
    const tmdb = new TheMovieDb();

    results = await tmdb.searchMulti({
      query: queryString,
      page: Number(req.query.page),
      language: req.locale ?? (req.query.language as string),
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
});

export default searchRoutes;
