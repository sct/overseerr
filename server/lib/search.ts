import TheMovieDb from '../api/themoviedb';
import {
  TmdbMovieDetails,
  TmdbMovieResult,
  TmdbPersonDetails,
  TmdbPersonResult,
  TmdbSearchMultiResponse,
  TmdbTvDetails,
  TmdbTvResult,
} from '../api/themoviedb/interfaces';
import {
  mapMovieDetailsToResult,
  mapPersonDetailsToResult,
  mapTvDetailsToResult,
} from '../models/Search';
import { isMovieDetails, isTvDetails } from '../utils/typeHelpers';

interface SearchProvider {
  id: string;
  pattern: RegExp;
  search: (id: string, language?: string) => Promise<TmdbSearchMultiResponse>;
}

const searchProviders: SearchProvider[] = [];

export const getSearchProvider = (
  query: string
): SearchProvider | undefined => {
  return searchProviders.find((provider) => provider.pattern.test(query));
};

searchProviders.push({
  id: 'TMDb',
  pattern: new RegExp(/(?<=[tT][mM][dD][bB]:)\d+/),
  search: async (
    id: string,
    language?: string
  ): Promise<TmdbSearchMultiResponse> => {
    const tmdb = new TheMovieDb();

    const moviePromise = tmdb.getMovie({ movieId: parseInt(id), language });
    const tvShowPromise = tmdb.getTvShow({ tvId: parseInt(id), language });
    const personPromise = tmdb.getPerson({ personId: parseInt(id), language });

    const responses = await Promise.allSettled([
      moviePromise,
      tvShowPromise,
      personPromise,
    ]);

    const selectedResponse = responses.find((r) => r.status === 'fulfilled') as
      | PromiseFulfilledResult<TmdbMovieDetails>
      | PromiseFulfilledResult<TmdbTvDetails>
      | PromiseFulfilledResult<TmdbPersonDetails>
      | undefined;

    const results: (TmdbMovieResult | TmdbTvResult | TmdbPersonResult)[] = [];

    if (selectedResponse) {
      if (isMovieDetails(selectedResponse.value)) {
        results.push(mapMovieDetailsToResult(selectedResponse.value));
      } else if (isTvDetails(selectedResponse.value)) {
        results.push(mapTvDetailsToResult(selectedResponse.value));
      } else {
        results.push(mapPersonDetailsToResult(selectedResponse.value));
      }
    }

    return {
      page: 1,
      total_pages: 1,
      total_results: results.length,
      results,
    };
  },
});

searchProviders.push({
  id: 'IMDb',
  pattern: new RegExp(/(?<=[iI][mM][dD][bB]:(tt){0,1})\d+/),
  search: async (
    id: string,
    language?: string
  ): Promise<TmdbSearchMultiResponse> => {
    const tmdb = new TheMovieDb();

    const responses = await tmdb.getByExternalId({
      externalId: `tt${id}`,
      type: 'imdb',
      language,
    });

    const results: (TmdbMovieResult | TmdbTvResult | TmdbPersonResult)[] = [];

    // set the media_type here since getting it from TMDb doesn't include the media_type
    // should set this in the api module?
    if (responses.movie_results.length) {
      results.push({ ...responses.movie_results[0], media_type: 'movie' });
    } else if (responses.tv_results.length) {
      results.push({ ...responses.tv_results[0], media_type: 'tv' });
    } else {
      results.push({ ...responses.person_results[0], media_type: 'person' });
    }

    return {
      page: 1,
      total_pages: 1,
      total_results: results.length,
      results,
    };
  },
});

searchProviders.push({
  id: 'TVDB',
  pattern: new RegExp(/(?<=[tT][vV][dD][bB]:)\d+/),
  search: async (
    id: string,
    language?: string
  ): Promise<TmdbSearchMultiResponse> => {
    const tmdb = new TheMovieDb();

    const responses = await tmdb.getByExternalId({
      externalId: parseInt(id),
      type: 'tvdb',
      language,
    });

    const results: (TmdbMovieResult | TmdbTvResult | TmdbPersonResult)[] = [];

    // set the media_type here since getting it from TMDb doesn't include the media_type
    // should set this in the api module?
    if (responses.movie_results.length) {
      results.push({ ...responses.movie_results[0], media_type: 'movie' });
    } else if (responses.tv_results.length) {
      results.push({ ...responses.tv_results[0], media_type: 'tv' });
    } else {
      results.push({ ...responses.person_results[0], media_type: 'person' });
    }

    return {
      page: 1,
      total_pages: 1,
      total_results: results.length,
      results,
    };
  },
});
