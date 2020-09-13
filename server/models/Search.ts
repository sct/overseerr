import type {
  TmdbMovieResult,
  TmdbPersonResult,
  TmdbTvResult,
} from '../api/themoviedb';
import type { MediaRequest } from '../entity/MediaRequest';

export type MediaType = 'tv' | 'movie' | 'person';

interface SearchResult {
  id: number;
  mediaType: MediaType;
  popularity: number;
  posterPath?: string;
  backdropPath?: string;
  voteCount: number;
  voteAverage: number;
  genreIds: number[];
  overview: string;
  originalLanguage: string;
  request?: MediaRequest;
}

export interface MovieResult extends SearchResult {
  mediaType: 'movie';
  title: string;
  originalTitle: string;
  releaseDate: string;
  adult: boolean;
  video: boolean;
  request?: MediaRequest;
}

export interface TvResult extends SearchResult {
  mediaType: 'tv';
  name: string;
  originalName: string;
  originCountry: string[];
  firstAirDate: string;
}

export interface PersonResult {
  id: number;
  name: string;
  popularity: number;
  profilePath?: string;
  adult: boolean;
  mediaType: 'person';
  knownFor: (MovieResult | TvResult)[];
}

export type Results = MovieResult | TvResult | PersonResult;

export const mapMovieResult = (
  movieResult: TmdbMovieResult,
  request?: MediaRequest
): MovieResult => ({
  id: movieResult.id,
  mediaType: 'movie',
  adult: movieResult.adult,
  genreIds: movieResult.genre_ids,
  originalLanguage: movieResult.original_language,
  originalTitle: movieResult.original_title,
  overview: movieResult.overview,
  popularity: movieResult.popularity,
  releaseDate: movieResult.release_date,
  title: movieResult.title,
  video: movieResult.video,
  voteAverage: movieResult.vote_average,
  voteCount: movieResult.vote_count,
  backdropPath: movieResult.backdrop_path,
  posterPath: movieResult.poster_path,
  request,
});

export const mapTvResult = (
  tvResult: TmdbTvResult,
  request?: MediaRequest
): TvResult => ({
  id: tvResult.id,
  firstAirDate: tvResult.first_air_Date,
  genreIds: tvResult.genre_ids,
  mediaType: tvResult.media_type,
  name: tvResult.name,
  originCountry: tvResult.origin_country,
  originalLanguage: tvResult.original_language,
  originalName: tvResult.original_name,
  overview: tvResult.overview,
  popularity: tvResult.popularity,
  voteAverage: tvResult.vote_average,
  voteCount: tvResult.vote_count,
  backdropPath: tvResult.backdrop_path,
  posterPath: tvResult.poster_path,
  request,
});

export const mapPersonResult = (
  personResult: TmdbPersonResult
): PersonResult => ({
  id: personResult.id,
  name: personResult.name,
  popularity: personResult.popularity,
  adult: personResult.adult,
  mediaType: personResult.media_type,
  profilePath: personResult.profile_path,
  knownFor: personResult.known_for.map((result) => {
    if (result.media_type === 'movie') {
      return mapMovieResult(result);
    }

    return mapTvResult(result);
  }),
});

export const mapSearchResults = (
  results: (TmdbMovieResult | TmdbTvResult | TmdbPersonResult)[],
  requests?: MediaRequest[]
): Results[] =>
  results.map((result) => {
    switch (result.media_type) {
      case 'movie':
        return mapMovieResult(
          result,
          requests?.find((req) => req.mediaId === result.id)
        );
      case 'tv':
        return mapTvResult(
          result,
          requests?.find((req) => req.mediaId === result.id)
        );
      default:
        return mapPersonResult(result);
    }
  });
