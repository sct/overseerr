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
