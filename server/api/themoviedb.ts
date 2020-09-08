import axios, { AxiosInstance } from 'axios';

interface SearchOptions {
  query: string;
  page?: number;
  includeAdult?: boolean;
}

interface TmdbMediaResult {
  id: number;
  media_type: string;
  popularity: number;
  poster_path?: string;
  backdrop_path?: string;
  vote_count: number;
  vote_average: number;
  genre_ids: number[];
  overview: string;
  original_language: string;
}

export interface TmdbMovieResult extends TmdbMediaResult {
  media_type: 'movie';
  title: string;
  original_title: string;
  release_date: string;
  adult: boolean;
  video: boolean;
}

export interface TmdbTvResult extends TmdbMediaResult {
  media_type: 'tv';
  name: string;
  original_name: string;
  origin_country: string[];
  first_air_Date: string;
}

export interface TmdbPersonResult {
  id: number;
  name: string;
  popularity: number;
  profile_path?: string;
  adult: boolean;
  media_type: 'person';
  known_for: (TmdbMovieResult | TmdbTvResult)[];
}

interface TmdbSearchMultiResponse {
  page: number;
  total_results: number;
  total_pages: number;
  results: (TmdbMovieResult | TmdbTvResult | TmdbPersonResult)[];
}

interface TmdbMovieDetails {
  id: number;
  imdb_id?: string;
  adult: boolean;
  backdrop_path?: string;
  poster_path?: string;
  budget: number;
  genres: {
    id: number;
    name: string;
  }[];
  homepage?: string;
  original_language: string;
  original_title: string;
  overview?: string;
  popularity: number;
  production_companies: {
    id: number;
    name: string;
    logo_path?: string;
    origin_country: string;
  }[];
  production_countries: {
    iso_3166_1: string;
    name: string;
  }[];
  release_date: string;
  revenue: number;
  runtime?: number;
  spoken_languages: {
    iso_639_1: string;
    name: string;
  }[];
  status: string;
  tagline?: string;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
}

interface TmdbTvEpisodeDetails {
  id: number;
  air_date: string;
  episode_number: number;
  name: string;
  overview: string;
  production_code: string;
  season_number: number;
  show_id: number;
  still_path: string;
  vote_average: number;
  vote_cuont: number;
}

interface TmdbTvDetails {
  id: number;
  backdrop_path?: string;
  created_by: {
    id: number;
    credit_id: string;
    name: string;
    gender: number;
    profile_path?: string;
  }[];
  episode_run_time: number[];
  first_air_date: string;
  genres: {
    id: number;
    name: string;
  }[];
  homepage: string;
  in_production: boolean;
  languages: string[];
  last_air_date: string;
  last_episode_to_air?: TmdbTvEpisodeDetails;
  name: string;
  next_episode_to_air?: TmdbTvEpisodeDetails;
  networks: {
    id: number;
    name: string;
    logo_path: string;
    origin_country: string;
  }[];
  number_of_episodes: number;
  number_of_seasons: number;
  origin_country: string[];
  original_language: string;
  original_name: string;
  overview: string;
  popularity: number;
  poster_path?: string;
  production_companies: {
    id: number;
    logo_path?: string;
    name: string;
    origin_country: string;
  }[];
  seasons: {
    id: number;
    air_date: string;
    episode_count: number;
    name: string;
    overview: string;
    poster_path: string;
    season_number: number;
  }[];
  status: string;
  type: string;
  vote_average: number;
  vote_count: number;
}

class TheMovieDb {
  private apiKey = 'db55323b8d3e4154498498a75642b381';
  private axios: AxiosInstance;

  constructor() {
    this.axios = axios.create({
      baseURL: 'https://api.themoviedb.org/3',
      params: {
        api_key: this.apiKey,
      },
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }

  public searchMulti = async ({
    query,
    page = 1,
    includeAdult = false,
  }: SearchOptions): Promise<TmdbSearchMultiResponse> => {
    try {
      const response = await this.axios.get('/search/multi', {
        params: { query, page, include_adult: includeAdult },
      });

      return response.data;
    } catch (e) {
      throw new Error(`[TMDB] Failed to search multi: ${e.message}`);
    }
  };

  public getMovie = async ({
    movieId,
    language = 'en-US',
  }: {
    movieId: number;
    language?: string;
  }): Promise<TmdbMovieDetails> => {
    try {
      const response = await this.axios.get<TmdbMovieDetails>(
        `/movie/${movieId}`,
        {
          params: { language },
        }
      );

      return response.data;
    } catch (e) {
      throw new Error(`[TMDB] Failed to fetch movie details: ${e.message}`);
    }
  };

  public getTvShow = async ({
    tvId,
    language = 'en-US',
  }: {
    tvId: number;
    language?: string;
  }): Promise<TmdbTvDetails> => {
    try {
      const response = await this.axios.get<TmdbTvDetails>(`/tv/${tvId}`, {
        params: { language },
      });

      return response.data;
    } catch (e) {
      throw new Error(`[TMDB] Failed to fetch tv show details: ${e.message}`);
    }
  };
}

export default TheMovieDb;
