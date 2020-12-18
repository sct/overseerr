import {
  Genre,
  ProductionCompany,
  Cast,
  Crew,
  mapCast,
  mapCrew,
  ExternalIds,
  mapExternalIds,
  Keyword,
} from './common';
import {
  TmdbTvEpisodeResult,
  TmdbTvSeasonResult,
  TmdbTvDetails,
  TmdbSeasonWithEpisodes,
} from '../api/themoviedb';
import type Media from '../entity/Media';

interface Episode {
  id: number;
  name: string;
  airDate: string;
  episodeNumber: number;
  overview: string;
  productionCode: string;
  seasonNumber: number;
  showId: number;
  stillPath?: string;
  voteAverage: number;
  voteCount: number;
}

interface Season {
  airDate: string;
  id: number;
  episodeCount: number;
  name: string;
  overview: string;
  posterPath?: string;
  seasonNumber: number;
}

export interface SeasonWithEpisodes extends Season {
  episodes: Episode[];
  externalIds: ExternalIds;
}

interface SpokenLanguage {
  englishName: string;
  iso_639_1: string;
  name: string;
}

export interface TvDetails {
  id: number;
  backdropPath?: string;
  posterPath?: string;
  createdBy: {
    id: number;
    name: string;
    gender: number;
    profilePath?: string;
  }[];
  episodeRunTime: number[];
  firstAirDate?: string;
  genres: Genre[];
  homepage: string;
  inProduction: boolean;
  languages: string[];
  lastAirDate: string;
  lastEpisodeToAir?: Episode;
  name: string;
  nextEpisodeToAir?: Episode;
  networks: ProductionCompany[];
  numberOfEpisodes: number;
  numberOfSeasons: number;
  originCountry: string[];
  originalLanguage: string;
  originalName: string;
  overview: string;
  popularity: number;
  productionCompanies: ProductionCompany[];
  spokenLanguages: SpokenLanguage[];
  seasons: Season[];
  status: string;
  type: string;
  voteAverage: number;
  voteCount: number;
  credits: {
    cast: Cast[];
    crew: Crew[];
  };
  externalIds: ExternalIds;
  keywords: Keyword[];
  mediaInfo?: Media;
}

const mapEpisodeResult = (episode: TmdbTvEpisodeResult): Episode => ({
  id: episode.id,
  airDate: episode.air_date,
  episodeNumber: episode.episode_number,
  name: episode.name,
  overview: episode.overview,
  productionCode: episode.production_code,
  seasonNumber: episode.season_number,
  showId: episode.show_id,
  voteAverage: episode.vote_average,
  voteCount: episode.vote_cuont,
  stillPath: episode.still_path,
});

const mapSeasonResult = (season: TmdbTvSeasonResult): Season => ({
  airDate: season.air_date,
  episodeCount: season.episode_count,
  id: season.id,
  name: season.name,
  overview: season.overview,
  seasonNumber: season.season_number,
  posterPath: season.poster_path,
});

export const mapSeasonWithEpisodes = (
  season: TmdbSeasonWithEpisodes
): SeasonWithEpisodes => ({
  airDate: season.air_date,
  episodeCount: season.episode_count,
  episodes: season.episodes.map(mapEpisodeResult),
  externalIds: mapExternalIds(season.external_ids),
  id: season.id,
  name: season.name,
  overview: season.overview,
  seasonNumber: season.season_number,
  posterPath: season.poster_path,
});

export const mapTvDetails = (
  show: TmdbTvDetails,
  media?: Media
): TvDetails => ({
  createdBy: show.created_by,
  episodeRunTime: show.episode_run_time,
  firstAirDate: show.first_air_date,
  genres: show.genres.map((genre) => ({
    id: genre.id,
    name: genre.name,
  })),
  homepage: show.homepage,
  id: show.id,
  inProduction: show.in_production,
  languages: show.languages,
  lastAirDate: show.last_air_date,
  name: show.name,
  networks: show.networks.map((network) => ({
    id: network.id,
    name: network.name,
    originCountry: network.origin_country,
    logoPath: network.logo_path,
  })),
  numberOfEpisodes: show.number_of_episodes,
  numberOfSeasons: show.number_of_seasons,
  originCountry: show.origin_country,
  originalLanguage: show.original_language,
  originalName: show.original_name,
  overview: show.overview,
  popularity: show.popularity,
  productionCompanies: show.production_companies.map((company) => ({
    id: company.id,
    name: company.name,
    originCountry: company.origin_country,
    logoPath: company.logo_path,
  })),
  spokenLanguages: show.spoken_languages.map((language) => ({
    englishName: language.english_name,
    iso_639_1: language.iso_639_1,
    name: language.name,
  })),
  seasons: show.seasons.map(mapSeasonResult),
  status: show.status,
  type: show.type,
  voteAverage: show.vote_average,
  voteCount: show.vote_count,
  backdropPath: show.backdrop_path,
  lastEpisodeToAir: show.last_episode_to_air
    ? mapEpisodeResult(show.last_episode_to_air)
    : undefined,
  nextEpisodeToAir: show.next_episode_to_air
    ? mapEpisodeResult(show.next_episode_to_air)
    : undefined,
  posterPath: show.poster_path,
  credits: {
    cast: show.credits.cast.map(mapCast),
    crew: show.credits.crew.map(mapCrew),
  },
  externalIds: mapExternalIds(show.external_ids),
  keywords: show.keywords.results.map((keyword) => ({
    id: keyword.id,
    name: keyword.name,
  })),
  mediaInfo: media,
});
