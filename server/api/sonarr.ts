import Axios, { AxiosInstance } from 'axios';
import logger from '../logger';

interface SonarrSeason {
  seasonNumber: number;
  monitored: boolean;
}

export interface SonarrSeries {
  title: string;
  sortTitle: string;
  seasonCount: number;
  status: string;
  overview: string;
  network: string;
  airTime: string;
  images: {
    coverType: string;
    url: string;
  }[];
  remotePoster: string;
  seasons: SonarrSeason[];
  year: number;
  path: string;
  profileId: number;
  languageProfileId: number;
  seasonFolder: boolean;
  monitored: boolean;
  useSceneNumbering: boolean;
  runtime: number;
  tvdbId: number;
  tvRageId: number;
  tvMazeId: number;
  firstAired: string;
  lastInfoSync?: string;
  seriesType: 'standard' | 'daily' | 'anime';
  cleanTitle: string;
  imdbId: string;
  titleSlug: string;
  certification: string;
  genres: string[];
  tags: string[];
  added: string;
  ratings: {
    votes: number;
    value: number;
  };
  qualityProfileId: number;
  id?: number;
  rootFolderPath?: string;
  addOptions?: {
    ignoreEpisodesWithFiles?: boolean;
    ignoreEpisodesWithoutFiles?: boolean;
    searchForMissingEpisodes?: boolean;
  };
}

interface SonarrProfile {
  id: number;
  name: string;
}

interface SonarrRootFolder {
  id: number;
  path: string;
  freeSpace: number;
  totalSpace: number;
  unmappedFolders: {
    name: string;
    path: string;
  }[];
}

interface AddSeriesOptions {
  tvdbid: number;
  title: string;
  profileId: number;
  seasons: number[];
  seasonFolder: boolean;
  rootFolderPath: string;
  seriesType: SonarrSeries['seriesType'];
  monitored?: boolean;
  searchNow?: boolean;
}

class SonarrAPI {
  private axios: AxiosInstance;
  constructor({ url, apiKey }: { url: string; apiKey: string }) {
    this.axios = Axios.create({
      baseURL: url,
      params: {
        apikey: apiKey,
      },
    });
  }

  public async getSeriesByTitle(title: string): Promise<SonarrSeries[]> {
    try {
      const response = await this.axios.get<SonarrSeries[]>('/series/lookup', {
        params: {
          term: title,
        },
      });

      if (!response.data[0]) {
        throw new Error('No series found');
      }

      return response.data;
    } catch (e) {
      logger.error('Error retrieving series by series title', {
        label: 'Sonarr API',
        message: e.message,
      });
      throw new Error('No series found');
    }
  }

  public async getSeriesByTvdbId(id: number): Promise<SonarrSeries> {
    try {
      const response = await this.axios.get<SonarrSeries[]>('/series/lookup', {
        params: {
          term: `tvdb:${id}`,
        },
      });

      if (!response.data[0]) {
        throw new Error('Series not found');
      }

      return response.data[0];
    } catch (e) {
      logger.error('Error retrieving series by tvdb ID', {
        label: 'Sonarr API',
        message: e.message,
      });
      throw new Error('Series not found');
    }
  }

  public async addSeries(options: AddSeriesOptions): Promise<boolean> {
    try {
      const series = await this.getSeriesByTvdbId(options.tvdbid);

      // If the series already exists, we will simply just update it
      if (series.id) {
        series.seasons = this.buildSeasonList(options.seasons, series.seasons);

        series.addOptions = {
          ignoreEpisodesWithFiles: true,
          searchForMissingEpisodes: options.searchNow,
        };

        const newSeriesResponse = await this.axios.put<SonarrSeries>(
          '/series',
          series
        );

        if (newSeriesResponse.data.id) {
          logger.info('Sonarr accepted request. Updated existing series', {
            label: 'Sonarr',
          });
          logger.debug('Sonarr add details', {
            label: 'Sonarr',
            movie: newSeriesResponse.data,
          });
        } else {
          logger.error('Failed to add movie to Sonarr', {
            label: 'Sonarr',
            options,
          });
          return false;
        }

        return true;
      }

      const createdSeriesResponse = await this.axios.post<SonarrSeries>(
        '/series',
        {
          tvdbId: options.tvdbid,
          title: options.title,
          profileId: options.profileId,
          seasons: this.buildSeasonList(
            options.seasons,
            series.seasons.map((season) => ({
              seasonNumber: season.seasonNumber,
              // We force all seasons to false if its the first request
              monitored: false,
            }))
          ),
          seasonFolder: options.seasonFolder,
          monitored: options.monitored,
          rootFolderPath: options.rootFolderPath,
          seriesType: options.seriesType,
          addOptions: {
            ignoreEpisodesWithFiles: true,
            searchForMissingEpisodes: options.searchNow,
          },
        } as Partial<SonarrSeries>
      );

      if (createdSeriesResponse.data.id) {
        logger.info('Sonarr accepted request', { label: 'Sonarr' });
        logger.debug('Sonarr add details', {
          label: 'Sonarr',
          movie: createdSeriesResponse.data,
        });
      } else {
        logger.error('Failed to add movie to Sonarr', {
          label: 'Sonarr',
          options,
        });
        return false;
      }

      return true;
    } catch (e) {
      logger.error('Something went wrong adding a series to Sonarr', {
        label: 'Sonarr API',
        errorMessage: e.message,
        error: e,
        response: e?.response?.data,
      });
      return false;
    }
  }

  public async getProfiles(): Promise<SonarrProfile[]> {
    try {
      const response = await this.axios.get<SonarrProfile[]>('/profile');

      return response.data;
    } catch (e) {
      logger.error('Something went wrong retrieving Sonarr profiles', {
        label: 'Sonarr API',
        message: e.message,
      });
      throw new Error('Failed to get profiles');
    }
  }

  public async getRootFolders(): Promise<SonarrRootFolder[]> {
    try {
      const response = await this.axios.get<SonarrRootFolder[]>('/rootfolder');

      return response.data;
    } catch (e) {
      logger.error('Something went wrong retrieving Sonarr root folders', {
        label: 'Sonarr API',
        message: e.message,
      });
      throw new Error('Failed to get root folders');
    }
  }

  private buildSeasonList(
    seasons: number[],
    existingSeasons?: SonarrSeason[]
  ): SonarrSeason[] {
    if (existingSeasons) {
      const newSeasons = existingSeasons.map((season) => {
        if (seasons.includes(season.seasonNumber)) {
          season.monitored = true;
        }
        return season;
      });

      return newSeasons;
    }

    const newSeasons = seasons.map(
      (seasonNumber): SonarrSeason => ({
        seasonNumber,
        monitored: true,
      })
    );

    return newSeasons;
  }
}

export default SonarrAPI;
