import type Media from '@server/entity/Media';
import type {
  Cast,
  Crew,
  ExternalIds,
  Genre,
  Keyword,
  ProductionCompany,
  WatchProviders,
} from './common';

export interface Video {
  url?: string;
  site: 'YouTube';
  key: string;
  name: string;
  size: number;
  type:
    | 'Clip'
    | 'Teaser'
    | 'Trailer'
    | 'Featurette'
    | 'Opening Credits'
    | 'Behind the Scenes'
    | 'Bloopers';
}

export interface ReleaseDetails {
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
  relatedVideos?: Video[];
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
  collection?: {
    id: number;
    name: string;
    posterPath?: string;
    backdropPath?: string;
  };
  mediaInfo?: Media;
  externalIds: ExternalIds;
  plexUrl?: string;
  watchProviders?: WatchProviders[];
  keywords: Keyword[];
}
