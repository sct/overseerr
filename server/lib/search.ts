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
  search: (id: number, language?: string) => Promise<TmdbSearchMultiResponse>;
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
    id: number,
    language?: string
  ): Promise<TmdbSearchMultiResponse> => {
    const tmdb = new TheMovieDb();

    const moviePromise = tmdb.getMovie({ movieId: id, language });
    const tvShowPromise = tmdb.getTvShow({ tvId: id, language });
    const personPromise = tmdb.getPerson({ personId: id, language });

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

    if (selectedResponse) {
      let results: (TmdbMovieResult | TmdbTvResult | TmdbPersonResult)[];

      if (isMovieDetails(selectedResponse.value)) {
        results = [mapMovieDetailsToResult(selectedResponse.value)];
      } else if (isTvDetails(selectedResponse.value)) {
        results = [mapTvDetailsToResult(selectedResponse.value)];
      } else {
        results = [mapPersonDetailsToResult(selectedResponse.value)];
      }

      return {
        page: 1,
        total_pages: 1,
        total_results: 1,
        results,
      };
    } else {
      return {
        page: 1,
        total_pages: 0,
        total_results: 0,
        results: [],
      };
    }
  },
});

// searchProviders.push({
//   id: 'IMDb',
//   pattern: new RegExp(/(?<=[iI][mM][dD][bB]:(tt){0,1})\d+/),
//   search: async (id: number): Promise<TmdbSearchMultiResponse> => {},
// });
