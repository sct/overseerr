import {
  TmdbCreditCast,
  TmdbCreditCrew,
  TmdbExternalIds,
} from '../api/themoviedb';

export interface ProductionCompany {
  id: number;
  logoPath?: string;
  originCountry: string;
  name: string;
}

export interface Keyword {
  id: number;
  name: string;
}

export interface Genre {
  id: number;
  name: string;
}

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

export interface ExternalIds {
  imdbId?: string;
  freebaseMid?: string;
  freebaseId?: string;
  tvdbId?: number;
  tvrageId?: string;
  facebookId?: string;
  instagramId?: string;
  twitterId?: string;
}

export const mapCast = (person: TmdbCreditCast): Cast => ({
  castId: person.cast_id,
  character: person.character,
  creditId: person.credit_id,
  id: person.id,
  name: person.name,
  order: person.order,
  gender: person.gender,
  profilePath: person.profile_path,
});

export const mapCrew = (person: TmdbCreditCrew): Crew => ({
  creditId: person.credit_id,
  department: person.department,
  id: person.id,
  job: person.job,
  name: person.name,
  gender: person.gender,
  profilePath: person.profile_path,
});

export const mapExternalIds = (eids: TmdbExternalIds): ExternalIds => ({
  facebookId: eids.facebook_id,
  freebaseId: eids.freebase_id,
  freebaseMid: eids.freebase_mid,
  imdbId: eids.imdb_id,
  instagramId: eids.instagram_id,
  tvdbId: eids.tvdb_id,
  tvrageId: eids.tvrage_id,
  twitterId: eids.twitter_id,
});
