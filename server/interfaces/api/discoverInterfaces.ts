export interface GenreSliderItem {
  id: number;
  name: string;
  backdrops: string[];
}

export interface WatchlistItem {
  ratingKey: string;
  tmdbId?: number;
  musicBrainzId?: string;
  mediaType: 'movie' | 'tv' | 'music';
  title: string;
}

export interface WatchlistResponse {
  page: number;
  totalPages: number;
  totalResults: number;
  results: WatchlistItem[];
}
