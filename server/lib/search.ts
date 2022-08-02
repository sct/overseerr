import TheMovieDb from '../api/themoviedb';
import {
  TmdbMovieDetails,
  TmdbMovieResult,
  TmdbPersonDetails,
  TmdbPersonResult,
  TmdbSearchMovieResponse,
  TmdbSearchMultiResponse,
  TmdbSearchTvResponse,
  TmdbTvDetails,
  TmdbTvResult,
} from '../api/themoviedb/interfaces';
import {
  mapMovieDetailsToResult,
  mapPersonDetailsToResult,
  mapTvDetailsToResult,
} from '../models/Search';
import { isMovie, isMovieDetails, isTvDetails } from '../utils/typeHelpers';

interface SearchProvider {
  pattern: RegExp;
  search: ({
    id,
    language,
    query,
  }: {
    id: string;
    language?: string;
    query?: string;
  }) => Promise<TmdbSearchMultiResponse>;
}

const searchProviders: SearchProvider[] = [];

export const findSearchProvider = (
  query: string
): SearchProvider | undefined => {
  return searchProviders.find((provider) => provider.pattern.test(query));
};

searchProviders.push({
  pattern: new RegExp(/(?<=tmdb:)\d+/),
  search: async ({ id, language }) => {
    const tmdb = new TheMovieDb();

    const moviePromise = tmdb.getMovie({ movieId: parseInt(id), language });
    const tvShowPromise = tmdb.getTvShow({ tvId: parseInt(id), language });
    const personPromise = tmdb.getPerson({ personId: parseInt(id), language });

    const responses = await Promise.allSettled([
      moviePromise,
      tvShowPromise,
      personPromise,
    ]);

    const successfulResponses = responses.filter(
      (r) => r.status === 'fulfilled'
    ) as
      | (
          | PromiseFulfilledResult<TmdbMovieDetails>
          | PromiseFulfilledResult<TmdbTvDetails>
          | PromiseFulfilledResult<TmdbPersonDetails>
        )[];

    const results: (TmdbMovieResult | TmdbTvResult | TmdbPersonResult)[] = [];

    if (successfulResponses.length) {
      results.push(
        ...successfulResponses.map((r) => {
          if (isMovieDetails(r.value)) {
            return mapMovieDetailsToResult(r.value);
          } else if (isTvDetails(r.value)) {
            return mapTvDetailsToResult(r.value);
          } else {
            return mapPersonDetailsToResult(r.value);
          }
        })
      );
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
  pattern: new RegExp(/(?<=imdb:)(tt|nm)\d+/),
  search: async ({ id, language }) => {
    const tmdb = new TheMovieDb();

    const responses = await tmdb.getByExternalId({
      externalId: id,
      type: 'imdb',
      language,
    });

    const results: (TmdbMovieResult | TmdbTvResult | TmdbPersonResult)[] = [];

    // set the media_type here since searching by external id doesn't return it
    results.push(
      ...(responses.movie_results.map((movie) => ({
        ...movie,
        media_type: 'movie',
      })) as TmdbMovieResult[]),
      ...(responses.tv_results.map((tv) => ({
        ...tv,
        media_type: 'tv',
      })) as TmdbTvResult[]),
      ...(responses.person_results.map((person) => ({
        ...person,
        media_type: 'person',
      })) as TmdbPersonResult[])
    );

    return {
      page: 1,
      total_pages: 1,
      total_results: results.length,
      results,
    };
  },
});

searchProviders.push({
  pattern: new RegExp(/(?<=tvdb:)\d+/),
  search: async ({ id, language }) => {
    const tmdb = new TheMovieDb();

    const responses = await tmdb.getByExternalId({
      externalId: parseInt(id),
      type: 'tvdb',
      language,
    });

    const results: (TmdbMovieResult | TmdbTvResult | TmdbPersonResult)[] = [];

    // set the media_type here since searching by external id doesn't return it
    results.push(
      ...(responses.movie_results.map((movie) => ({
        ...movie,
        media_type: 'movie',
      })) as TmdbMovieResult[]),
      ...(responses.tv_results.map((tv) => ({
        ...tv,
        media_type: 'tv',
      })) as TmdbTvResult[]),
      ...(responses.person_results.map((person) => ({
        ...person,
        media_type: 'person',
      })) as TmdbPersonResult[])
    );

    return {
      page: 1,
      total_pages: 1,
      total_results: results.length,
      results,
    };
  },
});

searchProviders.push({
  pattern: new RegExp(/(?<=year:)\d{4}/),
  search: async ({ id: year, query }) => {
    const tmdb = new TheMovieDb();

    const moviesPromise = tmdb.searchMovies({
      query: query?.replace(new RegExp(/year:\d{4}/), '') ?? '',
      year: parseInt(year),
    });
    const tvShowsPromise = tmdb.searchTvShows({
      query: query?.replace(new RegExp(/year:\d{4}/), '') ?? '',
      year: parseInt(year),
    });

    const responses = await Promise.allSettled([moviesPromise, tvShowsPromise]);

    const successfulResponses = responses.filter(
      (r) => r.status === 'fulfilled'
    ) as
      | (
          | PromiseFulfilledResult<TmdbSearchMovieResponse>
          | PromiseFulfilledResult<TmdbSearchTvResponse>
        )[];

    const results: (TmdbMovieResult | TmdbTvResult)[] = [];

    if (successfulResponses.length) {
      successfulResponses.forEach((response) => {
        response.value.results.forEach((result) =>
          // set the media_type here since the search endpoints don't return it
          results.push(
            isMovie(result)
              ? { ...result, media_type: 'movie' }
              : { ...result, media_type: 'tv' }
          )
        );
      });
    }

    return {
      page: 1,
      total_pages: 1,
      total_results: results.length,
      results,
    };
  },
});
