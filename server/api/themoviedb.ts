import axios, { AxiosInstance } from 'axios';

export const ANIME_KEYWORD_ID = 210024;

interface SearchOptions {
  query: string;
  page?: number;
  includeAdult?: boolean;
  language?: string;
}

interface DiscoverMovieOptions {
  page?: number;
  includeAdult?: boolean;
  language?: string;
  sortBy?:
    | 'popularity.asc'
    | 'popularity.desc'
    | 'release_date.asc'
    | 'release_date.desc'
    | 'revenue.asc'
    | 'revenue.desc'
    | 'primary_release_date.asc'
    | 'primary_release_date.desc'
    | 'original_title.asc'
    | 'original_title.desc'
    | 'vote_average.asc'
    | 'vote_average.desc'
    | 'vote_count.asc'
    | 'vote_count.desc';
}

interface DiscoverTvOptions {
  page?: number;
  language?: string;
  sortBy?:
    | 'popularity.asc'
    | 'popularity.desc'
    | 'vote_average.asc'
    | 'vote_average.desc'
    | 'vote_count.asc'
    | 'vote_count.desc'
    | 'first_air_date.asc'
    | 'first_air_date.desc';
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

interface TmdbPaginatedResponse {
  page: number;
  total_results: number;
  total_pages: number;
}

interface TmdbSearchMultiResponse extends TmdbPaginatedResponse {
  results: (TmdbMovieResult | TmdbTvResult | TmdbPersonResult)[];
}

interface TmdbSearchMovieResponse extends TmdbPaginatedResponse {
  results: TmdbMovieResult[];
}

interface TmdbSearchTvResponse extends TmdbPaginatedResponse {
  results: TmdbTvResult[];
}

interface TmdbUpcomingMoviesResponse extends TmdbPaginatedResponse {
  dates: {
    maximum: string;
    minimum: string;
  };
  results: TmdbMovieResult[];
}

interface TmdbExternalIdResponse {
  movie_results: TmdbMovieResult[];
  tv_results: TmdbTvResult[];
}

export interface TmdbCreditCast {
  cast_id: number;
  character: string;
  credit_id: string;
  gender?: number;
  id: number;
  name: string;
  order: number;
  profile_path?: string;
}

export interface TmdbCreditCrew {
  credit_id: string;
  gender?: number;
  id: number;
  name: string;
  profile_path?: string;
  job: string;
  department: string;
}

export interface TmdbExternalIds {
  imdb_id?: string;
  freebase_mid?: string;
  freebase_id?: string;
  tvdb_id?: number;
  tvrage_id?: string;
  facebook_id?: string;
  instagram_id?: string;
  twitter_id?: string;
}

export interface TmdbMovieDetails {
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
  credits: {
    cast: TmdbCreditCast[];
    crew: TmdbCreditCrew[];
  };
  external_ids: TmdbExternalIds;
}

export interface TmdbTvEpisodeResult {
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

export interface TmdbTvSeasonResult {
  id: number;
  air_date: string;
  episode_count: number;
  name: string;
  overview: string;
  poster_path?: string;
  season_number: number;
}

export interface TmdbTvDetails {
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
  last_episode_to_air?: TmdbTvEpisodeResult;
  name: string;
  next_episode_to_air?: TmdbTvEpisodeResult;
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
  spoken_languages: {
    english_name: string;
    iso_639_1: string;
    name: string;
  }[];
  seasons: TmdbTvSeasonResult[];
  status: string;
  type: string;
  vote_average: number;
  vote_count: number;
  credits: {
    cast: TmdbCreditCast[];
    crew: TmdbCreditCrew[];
  };
  external_ids: TmdbExternalIds;
  keywords: {
    results: TmdbKeyword[];
  };
}

export interface TmdbKeyword {
  id: number;
  name: string;
}

export interface TmdbPersonDetail {
  id: number;
  name: string;
  deathday: string;
  known_for_department: string;
  also_known_as?: string[];
  gender: number;
  biography: string;
  popularity: string;
  place_of_birth?: string;
  profile_path?: string;
  adult: boolean;
  imdb_id?: string;
  homepage?: string;
}

export interface TmdbPersonCredit {
  id: number;
  original_language: string;
  episode_count: number;
  overview: string;
  origin_country: string[];
  original_name: string;
  vote_count: number;
  name: string;
  media_type?: string;
  popularity: number;
  credit_id: string;
  backdrop_path?: string;
  first_air_date: string;
  vote_average: number;
  genre_ids?: number[];
  poster_path?: string;
  original_title: string;
  video?: boolean;
  title: string;
  adult: boolean;
  release_date: string;
}
export interface TmdbPersonCreditCast extends TmdbPersonCredit {
  character: string;
}

export interface TmdbPersonCreditCrew extends TmdbPersonCredit {
  department: string;
  job: string;
}

export interface TmdbPersonCombinedCredits {
  id: number;
  cast: TmdbPersonCreditCast[];
  crew: TmdbPersonCreditCrew[];
}

export interface TmdbSeasonWithEpisodes extends TmdbTvSeasonResult {
  episodes: TmdbTvEpisodeResult[];
  external_ids: TmdbExternalIds;
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
    language = 'en-US',
  }: SearchOptions): Promise<TmdbSearchMultiResponse> => {
    try {
      const response = await this.axios.get('/search/multi', {
        params: { query, page, include_adult: includeAdult, language },
      });

      return response.data;
    } catch (e) {
      throw new Error(`[TMDB] Failed to search multi: ${e.message}`);
    }
  };

  public getPerson = async ({
    personId,
    language = 'en-US',
  }: {
    personId: number;
    language?: string;
  }): Promise<TmdbPersonDetail> => {
    try {
      const response = await this.axios.get<TmdbPersonDetail>(
        `/person/${personId}`,
        {
          params: { language },
        }
      );

      return response.data;
    } catch (e) {
      throw new Error(`[TMDB] Failed to fetch person details: ${e.message}`);
    }
  };

  public getPersonCombinedCredits = async ({
    personId,
    language = 'en-US',
  }: {
    personId: number;
    language?: string;
  }): Promise<TmdbPersonCombinedCredits> => {
    try {
      const response = await this.axios.get<TmdbPersonCombinedCredits>(
        `/person/${personId}/combined_credits`,
        {
          params: { language },
        }
      );

      return response.data;
    } catch (e) {
      throw new Error(
        `[TMDB] Failed to fetch person combined credits: ${e.message}`
      );
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
          params: { language, append_to_response: 'credits,external_ids' },
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
        params: {
          language,
          append_to_response: 'credits,external_ids,keywords',
        },
      });

      return response.data;
    } catch (e) {
      throw new Error(`[TMDB] Failed to fetch tv show details: ${e.message}`);
    }
  };

  public getTvSeason = async ({
    tvId,
    seasonNumber,
    language,
  }: {
    tvId: number;
    seasonNumber: number;
    language?: string;
  }): Promise<TmdbSeasonWithEpisodes> => {
    try {
      const response = await this.axios.get<TmdbSeasonWithEpisodes>(
        `/tv/${tvId}/season/${seasonNumber}`,
        {
          params: {
            language,
            append_to_response: 'external_ids',
          },
        }
      );

      return response.data;
    } catch (e) {
      throw new Error(`[TMDB] Failed to fetch tv show details: ${e.message}`);
    }
  };

  public async getMovieRecommendations({
    movieId,
    page = 1,
    language = 'en-US',
  }: {
    movieId: number;
    page?: number;
    language?: string;
  }): Promise<TmdbSearchMovieResponse> {
    try {
      const response = await this.axios.get<TmdbSearchMovieResponse>(
        `/movie/${movieId}/recommendations`,
        {
          params: {
            page,
            language,
          },
        }
      );

      return response.data;
    } catch (e) {
      throw new Error(`[TMDB] Failed to fetch discover movies: ${e.message}`);
    }
  }

  public async getMovieSimilar({
    movieId,
    page = 1,
    language = 'en-US',
  }: {
    movieId: number;
    page?: number;
    language?: string;
  }): Promise<TmdbSearchMovieResponse> {
    try {
      const response = await this.axios.get<TmdbSearchMovieResponse>(
        `/movie/${movieId}/similar`,
        {
          params: {
            page,
            language,
          },
        }
      );

      return response.data;
    } catch (e) {
      throw new Error(`[TMDB] Failed to fetch discover movies: ${e.message}`);
    }
  }

  public async getTvRecommendations({
    tvId,
    page = 1,
    language = 'en-US',
  }: {
    tvId: number;
    page?: number;
    language?: string;
  }): Promise<TmdbSearchTvResponse> {
    try {
      const response = await this.axios.get<TmdbSearchTvResponse>(
        `/tv/${tvId}/recommendations`,
        {
          params: {
            page,
            language,
          },
        }
      );

      return response.data;
    } catch (e) {
      throw new Error(
        `[TMDB] Failed to fetch tv recommendations: ${e.message}`
      );
    }
  }

  public async getTvSimilar({
    tvId,
    page = 1,
    language = 'en-US',
  }: {
    tvId: number;
    page?: number;
    language?: string;
  }): Promise<TmdbSearchTvResponse> {
    try {
      const response = await this.axios.get<TmdbSearchTvResponse>(
        `/tv/${tvId}/similar`,
        {
          params: {
            page,
            language,
          },
        }
      );

      return response.data;
    } catch (e) {
      throw new Error(`[TMDB] Failed to fetch tv similar: ${e.message}`);
    }
  }

  public getDiscoverMovies = async ({
    sortBy = 'popularity.desc',
    page = 1,
    includeAdult = false,
    language = 'en-US',
  }: DiscoverMovieOptions = {}): Promise<TmdbSearchMovieResponse> => {
    try {
      const response = await this.axios.get<TmdbSearchMovieResponse>(
        '/discover/movie',
        {
          params: {
            sort_by: sortBy,
            page,
            include_adult: includeAdult,
            language,
          },
        }
      );

      return response.data;
    } catch (e) {
      throw new Error(`[TMDB] Failed to fetch discover movies: ${e.message}`);
    }
  };

  public getDiscoverTv = async ({
    sortBy = 'popularity.desc',
    page = 1,
    language = 'en-US',
  }: DiscoverTvOptions = {}): Promise<TmdbSearchTvResponse> => {
    try {
      const response = await this.axios.get<TmdbSearchTvResponse>(
        '/discover/tv',
        {
          params: {
            sort_by: sortBy,
            page,
            language,
          },
        }
      );

      return response.data;
    } catch (e) {
      throw new Error(`[TMDB] Failed to fetch discover tv: ${e.message}`);
    }
  };

  public getUpcomingMovies = async ({
    page = 1,
    language = 'en-US',
  }: {
    page: number;
    language: string;
  }): Promise<TmdbUpcomingMoviesResponse> => {
    try {
      const response = await this.axios.get<TmdbUpcomingMoviesResponse>(
        '/movie/upcoming',
        {
          params: {
            page,
            language,
          },
        }
      );

      return response.data;
    } catch (e) {
      throw new Error(`[TMDB] Failed to fetch upcoming movies: ${e.message}`);
    }
  };

  public getAllTrending = async ({
    page = 1,
    timeWindow = 'day',
    language = 'en-US',
  }: {
    page?: number;
    timeWindow?: 'day' | 'week';
    language?: string;
  } = {}): Promise<TmdbSearchMultiResponse> => {
    try {
      const response = await this.axios.get<TmdbSearchMultiResponse>(
        `/trending/all/${timeWindow}`,
        {
          params: {
            page,
            language,
          },
        }
      );

      return response.data;
    } catch (e) {
      throw new Error(`[TMDB] Failed to fetch all trending: ${e.message}`);
    }
  };

  public getMovieTrending = async ({
    page = 1,
    timeWindow = 'day',
  }: {
    page?: number;
    timeWindow?: 'day' | 'week';
  } = {}): Promise<TmdbSearchMovieResponse> => {
    try {
      const response = await this.axios.get<TmdbSearchMovieResponse>(
        `/trending/movie/${timeWindow}`,
        {
          params: {
            page,
          },
        }
      );

      return response.data;
    } catch (e) {
      throw new Error(`[TMDB] Failed to fetch all trending: ${e.message}`);
    }
  };

  public getTvTrending = async ({
    page = 1,
    timeWindow = 'day',
  }: {
    page?: number;
    timeWindow?: 'day' | 'week';
  } = {}): Promise<TmdbSearchTvResponse> => {
    try {
      const response = await this.axios.get<TmdbSearchTvResponse>(
        `/trending/tv/${timeWindow}`,
        {
          params: {
            page,
          },
        }
      );

      return response.data;
    } catch (e) {
      throw new Error(`[TMDB] Failed to fetch all trending: ${e.message}`);
    }
  };

  public async getByExternalId({
    externalId,
    type,
    language = 'en-US',
  }:
    | {
        externalId: string;
        type: 'imdb';
        language?: string;
      }
    | {
        externalId: number;
        type: 'tvdb';
        language?: string;
      }): Promise<TmdbExternalIdResponse> {
    try {
      const response = await this.axios.get<TmdbExternalIdResponse>(
        `/find/${externalId}`,
        {
          params: {
            external_source: type === 'imdb' ? 'imdb_id' : 'tvdb_id',
            language,
          },
        }
      );

      return response.data;
    } catch (e) {
      throw new Error(`[TMDB] Failed to find by external ID: ${e.message}`);
    }
  }

  public async getMovieByImdbId({
    imdbId,
    language = 'en-US',
  }: {
    imdbId: string;
    language?: string;
  }): Promise<TmdbMovieDetails> {
    try {
      const extResponse = await this.getByExternalId({
        externalId: imdbId,
        type: 'imdb',
      });

      if (extResponse.movie_results[0]) {
        const movie = await this.getMovie({
          movieId: extResponse.movie_results[0].id,
          language,
        });

        return movie;
      }

      throw new Error(
        '[TMDB] Failed to find a title with the provided IMDB id'
      );
    } catch (e) {
      throw new Error(
        `[TMDB] Failed to get movie by external imdb ID: ${e.message}`
      );
    }
  }

  public async getShowByTvdbId({
    tvdbId,
    language = 'en-US',
  }: {
    tvdbId: number;
    language?: string;
  }): Promise<TmdbTvDetails> {
    try {
      const extResponse = await this.getByExternalId({
        externalId: tvdbId,
        type: 'tvdb',
      });

      if (extResponse.tv_results[0]) {
        const tvshow = await this.getTvShow({
          tvId: extResponse.tv_results[0].id,
          language,
        });

        return tvshow;
      }

      throw new Error(
        `[TMDB] Failed to find a tv show with the provided TVDB id: ${tvdbId}`
      );
    } catch (e) {
      throw new Error(
        `[TMDB] Failed to get tv show by external tvdb ID: ${e.message}`
      );
    }
  }
}

export default TheMovieDb;
