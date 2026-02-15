import logger from '@server/logger';
import ServarrBase from './base';

export interface RadarrMovieOptions {
  title: string;
  qualityProfileId: number;
  minimumAvailability: string;
  tags: number[];
  profileId: number;
  year: number;
  rootFolderPath: string;
  tmdbId: number;
  monitored?: boolean;
  searchNow?: boolean;
}

export interface RadarrMovie {
  id: number;
  title: string;
  isAvailable: boolean;
  monitored: boolean;
  tmdbId: number;
  imdbId: string;
  titleSlug: string;
  folderName: string;
  path: string;
  profileId: number;
  qualityProfileId: number;
  added: string;
  hasFile: boolean;
  tags: number[];
  inCinemas?: string;
  physicalRelease?: string;
  digitalRelease?: string;
  youTubeTrailerId?: string;
  movieFile?: {
    id: number;
    relativePath: string;
    path: string;
    size: number;
    dateAdded: string;
    sceneName?: string;
    releaseGroup?: string;
    quality: {
      quality: {
        id: number;
        name: string;
        source: string;
        resolution: number;
      };
      revision: {
        version: number;
        real: number;
        isRepack: boolean;
      };
    };
    mediaInfo?: {
      containerFormat?: string;
      videoFormat?: string;
      videoCodecID?: string;
      videoProfile?: string;
      videoBitrate?: number;
      videoBitDepth?: number;
      videoMultiViewCount?: number;
      videoColourPrimaries?: string;
      videoTransferCharacteristics?: string;
      width?: number;
      height?: number;
      audioFormat?: string;
      audioCodecID?: string;
      audioProfile?: string;
      audioAdditionalFeatures?: string;
      audioBitrate?: number;
      runTime?: string;
      audioStreamCount?: number;
      audioChannels?: number;
      audioChannelPositions?: string;
      videoFps?: number;
      audioLanguages?: string;
      subtitles?: string;
      scanType?: string;
      schemaRevision?: number;
    };
  };
}

class RadarrAPI extends ServarrBase<{ movieId: number }> {
  constructor({ url, apiKey }: { url: string; apiKey: string }) {
    super({ url, apiKey, cacheName: 'radarr', apiName: 'Radarr' });
  }

  public getMovies = async (): Promise<RadarrMovie[]> => {
    try {
      const response = await this.axios.get<RadarrMovie[]>('/movie');

      return response.data;
    } catch (e) {
      throw new Error(`[Radarr] Failed to retrieve movies: ${e.message}`);
    }
  };

  public getMovie = async ({ id }: { id: number }): Promise<RadarrMovie> => {
    try {
      const response = await this.axios.get<RadarrMovie>(`/movie/${id}`);

      return response.data;
    } catch (e) {
      throw new Error(`[Radarr] Failed to retrieve movie: ${e.message}`);
    }
  };

  public async getMovieByTmdbId(id: number): Promise<RadarrMovie> {
    try {
      const response = await this.axios.get<RadarrMovie[]>('/movie/lookup', {
        params: {
          term: `tmdb:${id}`,
        },
      });

      if (!response.data[0]) {
        throw new Error('Movie not found');
      }

      return response.data[0];
    } catch (e) {
      logger.error('Error retrieving movie by TMDB ID', {
        label: 'Radarr API',
        errorMessage: e.message,
        tmdbId: id,
      });
      throw new Error('Movie not found');
    }
  }

  public addMovie = async (
    options: RadarrMovieOptions
  ): Promise<RadarrMovie> => {
    try {
      const movie = await this.getMovieByTmdbId(options.tmdbId);

      if (movie.hasFile) {
        logger.info(
          'Title already exists and is available. Skipping add and returning success',
          {
            label: 'Radarr',
            movie,
          }
        );
        return movie;
      }

      // movie exists in Radarr but is neither downloaded nor monitored
      if (movie.id && !movie.monitored) {
        const response = await this.axios.put<RadarrMovie>(`/movie`, {
          ...movie,
          title: options.title,
          qualityProfileId: options.qualityProfileId,
          profileId: options.profileId,
          titleSlug: options.tmdbId.toString(),
          minimumAvailability: options.minimumAvailability,
          tmdbId: options.tmdbId,
          year: options.year,
          tags: Array.from(new Set([...movie.tags, ...options.tags])),
          rootFolderPath: options.rootFolderPath,
          monitored: options.monitored,
          addOptions: {
            searchForMovie: options.searchNow,
          },
        });

        if (response.data.monitored) {
          logger.info(
            'Found existing title in Radarr and set it to monitored.',
            {
              label: 'Radarr',
              movieId: response.data.id,
              movieTitle: response.data.title,
            }
          );
          logger.debug('Radarr update details', {
            label: 'Radarr',
            movie: response.data,
          });

          if (options.searchNow) {
            this.searchMovie(response.data.id);
          }

          return response.data;
        } else {
          logger.error('Failed to update existing movie in Radarr.', {
            label: 'Radarr',
            options,
          });
          throw new Error('Failed to update existing movie in Radarr');
        }
      }

      if (movie.id) {
        logger.info(
          'Movie is already monitored in Radarr. Skipping add and returning success',
          { label: 'Radarr' }
        );
        return movie;
      }

      const response = await this.axios.post<RadarrMovie>(`/movie`, {
        title: options.title,
        qualityProfileId: options.qualityProfileId,
        profileId: options.profileId,
        titleSlug: options.tmdbId.toString(),
        minimumAvailability: options.minimumAvailability,
        tmdbId: options.tmdbId,
        year: options.year,
        rootFolderPath: options.rootFolderPath,
        monitored: options.monitored,
        tags: options.tags,
        addOptions: {
          searchForMovie: options.searchNow,
        },
      });

      if (response.data.id) {
        logger.info('Radarr accepted request', { label: 'Radarr' });
        logger.debug('Radarr add details', {
          label: 'Radarr',
          movie: response.data,
        });
      } else {
        logger.error('Failed to add movie to Radarr', {
          label: 'Radarr',
          options,
        });
        throw new Error('Failed to add movie to Radarr');
      }
      return response.data;
    } catch (e) {
      logger.error(
        'Failed to add movie to Radarr. This might happen if the movie already exists, in which case you can safely ignore this error.',
        {
          label: 'Radarr',
          errorMessage: e.message,
          options,
          response: e?.response?.data,
        }
      );
      throw new Error('Failed to add movie to Radarr');
    }
  };

  public async searchMovie(movieId: number): Promise<void> {
    logger.info('Executing movie search command', {
      label: 'Radarr API',
      movieId,
    });

    try {
      await this.runCommand('MoviesSearch', { movieIds: [movieId] });
    } catch (e) {
      logger.error(
        'Something went wrong while executing Radarr movie search.',
        {
          label: 'Radarr API',
          errorMessage: e.message,
          movieId,
        }
      );
    }
  }

  public async getCalendar(
    start: string,
    end: string,
    options?: { tags?: string[] }
  ): Promise<RadarrMovie[]> {
    try {
      const params: Record<string, any> = {
        start,
        end,
      };

      if (options?.tags?.length) {
        params.tags = options.tags.join(',');
      }

      const response = await this.axios.get<RadarrMovie[]>('/calendar', {
        params,
      });

      return response.data;
    } catch (e) {
      logger.error('Failed to retrieve calendar from Radarr', {
        label: 'Radarr API',
        errorMessage: e.message,
        start,
        end,
        tags: options?.tags,
      });
      throw new Error(`[Radarr] Failed to retrieve calendar: ${e.message}`);
    }
  }

  public async getMovieFile(
    movieFileId: number
  ): Promise<RadarrMovie['movieFile']> {
    try {
      const response = await this.axios.get(`/moviefile/${movieFileId}`);
      return response.data;
    } catch (e) {
      logger.error('Failed to retrieve movie file from Radarr', {
        label: 'Radarr API',
        errorMessage: e.message,
        movieFileId,
      });
      throw new Error(`[Radarr] Failed to retrieve movie file: ${e.message}`);
    }
  }

  public async deleteMovieFile(movieFileId: number): Promise<void> {
    try {
      await this.axios.delete(`/moviefile/${movieFileId}`);
    } catch (e) {
      logger.error('Failed to delete movie file from Radarr', {
        label: 'Radarr API',
        errorMessage: e.message,
        movieFileId,
      });
      throw new Error(`[Radarr] Failed to delete movie file: ${e.message}`);
    }
  }

  public async getHistory(movieId: number, pageSize = 1000): Promise<any> {
    try {
      const response = await this.axios.get('/history', {
        params: {
          pageSize,
          page: 1,
          sortKey: 'date',
          sortDirection: 'descending',
          movieId,
        },
      });
      return response.data;
    } catch (e) {
      logger.error('Failed to retrieve history from Radarr', {
        label: 'Radarr API',
        errorMessage: e.message,
        movieId,
      });
      throw new Error(`[Radarr] Failed to retrieve history: ${e.message}`);
    }
  }
}

export default RadarrAPI;
