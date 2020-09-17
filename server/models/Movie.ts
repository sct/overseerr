import {
  TmdbMovieDetails,
  TmdbCreditCast,
  TmdbCreditCrew,
} from '../api/themoviedb';
import { MediaRequest } from '../entity/MediaRequest';
import { ProductionCompany, Genre } from './common';

export interface Cast {
  id: number;
  castId: number;
  character: string;
  creditId: string;
  gender?: number;
  name: string;
  order: number;
  profilePath?: string;
}

export interface Crew {
  id: number;
  creditId: string;
  department: string;
  gender?: number;
  job: string;
  name: string;
  profilePath?: string;
}

export interface MovieDetails {
  id: number;
  imdbId?: string;
  adult: boolean;
  backdropPath?: string;
  budget: number;
  genres: Genre[];
  homepage?: string;
  originalLanguage: string;
  originalTitle: string;
  overview?: string;
  popularity: number;
  posterPath?: string;
  productionCompanies: ProductionCompany[];
  productionCountries: {
    iso_3166_1: string;
    name: string;
  }[];
  releaseDate: string;
  revenue: number;
  runtime?: number;
  spokenLanguages: {
    iso_639_1: string;
    name: string;
  }[];
  status: string;
  tagline?: string;
  title: string;
  video: boolean;
  voteAverage: number;
  voteCount: number;
  credits: {
    cast: Cast[];
    crew: Crew[];
  };
  request?: MediaRequest;
}

const mapCast = (person: TmdbCreditCast): Cast => ({
  castId: person.cast_id,
  character: person.character,
  creditId: person.credit_id,
  id: person.id,
  name: person.name,
  order: person.order,
  gender: person.gender,
  profilePath: person.profile_path,
});

const mapCrew = (person: TmdbCreditCrew): Crew => ({
  creditId: person.credit_id,
  department: person.department,
  id: person.id,
  job: person.job,
  name: person.name,
  gender: person.gender,
  profilePath: person.profile_path,
});

export const mapMovieDetails = (
  movie: TmdbMovieDetails,
  request?: MediaRequest
): MovieDetails => ({
  id: movie.id,
  adult: movie.adult,
  budget: movie.budget,
  genres: movie.genres,
  originalLanguage: movie.original_language,
  originalTitle: movie.original_title,
  popularity: movie.popularity,
  productionCompanies: movie.production_companies.map((company) => ({
    id: company.id,
    logoPath: company.logo_path,
    originCountry: company.origin_country,
    name: company.name,
  })),
  productionCountries: movie.production_countries,
  releaseDate: movie.release_date,
  revenue: movie.revenue,
  spokenLanguages: movie.spoken_languages,
  status: movie.status,
  title: movie.title,
  video: movie.video,
  voteAverage: movie.vote_average,
  voteCount: movie.vote_count,
  backdropPath: movie.backdrop_path,
  homepage: movie.homepage,
  imdbId: movie.imdb_id,
  overview: movie.overview,
  posterPath: movie.poster_path,
  runtime: movie.runtime,
  tagline: movie.tagline,
  credits: {
    cast: movie.credits.cast.map(mapCast),
    crew: movie.credits.crew.map(mapCrew),
  },
  request,
});
