import { TmdbCreditCast, TmdbCreditCrew } from '../api/themoviedb';

export interface ProductionCompany {
  id: number;
  logoPath?: string;
  originCountry: string;
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
