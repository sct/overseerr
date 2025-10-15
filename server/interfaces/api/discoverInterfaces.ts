import type { MovieResult, TvResult } from '@server/models/Search';

export interface GenreSliderItem {
  id: number;
  name: string;
  backdrops: string[];
}

export interface WatchlistItem {
  ratingKey: string;
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
}

export interface WatchlistResponse {
  page: number;
  totalPages: number;
  totalResults: number;
  results: WatchlistItem[];
}

export interface TmdbListResponse {
  page: number;
  totalPages: number;
  totalResults: number;
  list: {
    id: string;
    name: string;
    description: string;
  };
  results: (MovieResult | TvResult)[];
}
