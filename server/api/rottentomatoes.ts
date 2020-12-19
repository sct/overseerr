import axios, { AxiosInstance } from 'axios';

interface RTMovieOldSearchResult {
  id: number;
  title: string;
  year: number;
  ratings: {
    critics_rating: 'Certified Fresh' | 'Fresh' | 'Rotten';
    critics_score: number;
    audience_rating: 'Upright' | 'Spilled';
    audience_score: number;
  };
  links: {
    self: string;
    alternate: string;
  };
}

interface RTTvSearchResult {
  title: string;
  meterClass: 'fresh' | 'rotten';
  meterScore: number;
  url: string;
  startYear: number;
  endYear: number;
}

interface RTMovieSearchResponse {
  total: number;
  movies: RTMovieOldSearchResult[];
}

interface RTMultiSearchResponse {
  tvCount: number;
  tvSeries: RTTvSearchResult[];
}

export interface RTRating {
  title: string;
  year: number;
  criticsRating: 'Certified Fresh' | 'Fresh' | 'Rotten';
  criticsScore: number;
  audienceRating?: 'Upright' | 'Spilled';
  audienceScore?: number;
  url: string;
}

/**
 * This is a best-effort API. The Rotten Tomatoes API is technically
 * private and getting access costs money/requires approval.
 *
 * They do, however, have a "public" api that they use to request the
 * data on their own site. We use this to get ratings for movies/tv shows.
 *
 * Unfortunately, we need to do it by searching for the movie name, so it's
 * not always accurate.
 */
class RottenTomatoes {
  private axios: AxiosInstance;

  constructor() {
    this.axios = axios.create({
      baseURL: 'https://www.rottentomatoes.com/api/private',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }

  /**
   * Search the 1.0 api for the movie title
   *
   * We compare the release date to make sure its the correct
   * match. But it's not guaranteed to have results.
   *
   * We use the 1.0 API here because the 2.0 search api does
   * not return audience ratings.
   *
   * @param name Movie name
   * @param year Release Year
   */
  public async getMovieRatings(
    name: string,
    year: number
  ): Promise<RTRating | null> {
    try {
      const response = await this.axios.get<RTMovieSearchResponse>(
        '/v1.0/movies',
        {
          params: { q: name },
        }
      );

      const movie = response.data.movies.find((movie) => movie.year === year);

      if (!movie) {
        return null;
      }

      return {
        title: movie.title,
        url: movie.links.alternate,
        criticsRating: movie.ratings.critics_rating,
        criticsScore: movie.ratings.critics_score,
        audienceRating: movie.ratings.audience_rating,
        audienceScore: movie.ratings.audience_score,
        year: movie.year,
      };
    } catch (e) {
      throw new Error(
        `[RT API] Failed to retrieve movie ratings: ${e.message}`
      );
    }
  }

  public async getTVRatings(
    name: string,
    year?: number
  ): Promise<RTRating | null> {
    try {
      const response = await this.axios.get<RTMultiSearchResponse>(
        '/v2.0/search/',
        {
          params: { q: name, limit: 10 },
        }
      );

      let tvshow: RTTvSearchResult | undefined = response.data.tvSeries[0];

      if (year) {
        tvshow = response.data.tvSeries.find(
          (series) => series.startYear === year
        );
      }

      if (!tvshow) {
        return null;
      }

      return {
        title: tvshow.title,
        url: `https://www.rottentomatoes.com${tvshow.url}`,
        criticsRating: tvshow.meterClass === 'fresh' ? 'Fresh' : 'Rotten',
        criticsScore: tvshow.meterScore,
        year: tvshow.startYear,
      };
    } catch (e) {
      throw new Error(`[RT API] Failed to retrieve tv ratings: ${e.message}`);
    }
  }
}

export default RottenTomatoes;
