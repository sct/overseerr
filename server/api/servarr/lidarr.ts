import logger from '@server/logger';
import ServarrBase from './base';

export interface LidarrMusicOptions {
  title: string;
  qualityProfileId: number;
  tags: number[];
  profileId: number;
  year: number;
  rootFolderPath: string;
  mbId: number;
  monitored?: boolean;
  searchNow?: boolean;
}

export interface LidarrMusic {
  id: number;
  title: string;
  isAvailable: boolean;
  monitored: boolean;
  mbId: number;
  imdbId: string;
  titleSlug: string;
  folderName: string;
  path: string;
  profileId: number;
  qualityProfileId: number;
  added: string;
  hasFile: boolean;
}


class LidarrAPI extends ServarrBase<{ musicId: number }> {
  constructor({ url, apiKey }: { url: string; apiKey: string }) {
    super({ url, apiKey, cacheName: 'lidarr', apiName: 'Lidarr' });
  }

  public getMusics = async (): Promise<LidarrMusic[]> => {
    try {
      const response = await this.axios.get<LidarrMusic[]>('/music');

      return response.data;
    } catch (e) {
      throw new Error(`[Lidarr] Failed to retrieve musics: ${e.message}`);
    }
  };

  public getMusic = async ({ id }: { id: number }): Promise<LidarrMusic> => {
    try {
      const response = await this.axios.get<LidarrMusic>(`/music/${id}`);

      return response.data;
    } catch (e) {
      throw new Error(`[Lidarr] Failed to retrieve music: ${e.message}`);
    }
  };

  public async getMusicBymbId(id: number): Promise<LidarrMusic> {
    try {
      const response = await this.axios.get<LidarrMusic[]>('/music/lookup', {
        params: {
          term: `musicbrainz:${id}`,
        },
      });

      if (!response.data[0]) {
        throw new Error('Music not found');
      }

      return response.data[0];
    } catch (e) {
      logger.error('Error retrieving music by MUSICBRAINZ ID', {
        label: 'Lidarr API',
        errorMessage: e.message,
        mbId: id,
      });
      throw new Error('Music not found');
    }
  }

  public addMusic = async (
    options: LidarrMusicOptions
  ): Promise<LidarrMusic> => {
    try {
      const music = await this.getMusicBymbId(options.mbId);

      if (music.hasFile) {
        logger.info(
          'Title already exists and is available. Skipping add and returning success',
          {
            label: 'Lidarr',
            music,
          }
        );
        return music;
      }

      // music exists in Lidarr but is neither downloaded nor monitored
      if (music.id && !music.monitored) {
        const response = await this.axios.put<LidarrMusic>(`/music`, {
          ...music,
          title: options.title,
          qualityProfileId: options.qualityProfileId,
          profileId: options.profileId,
          titleSlug: options.mbId.toString(),
          mbId: options.mbId,
          year: options.year,
          tags: options.tags,
          rootFolderPath: options.rootFolderPath,
          monitored: options.monitored,
          addOptions: {
            searchForMusic: options.searchNow,
          },
        });

        if (response.data.monitored) {
          logger.info(
            'Found existing title in Lidarr and set it to monitored.',
            {
              label: 'Lidarr',
              musicId: response.data.id,
              musicTitle: response.data.title,
            }
          );
          logger.debug('Lidarr update details', {
            label: 'Lidarr',
            music: response.data,
          });

          if (options.searchNow) {
            this.searchMusic(response.data.id);
          }

          return response.data;
        } else {
          logger.error('Failed to update existing music in Lidarr.', {
            label: 'Lidarr',
            options,
          });
          throw new Error('Failed to update existing music in Lidarr');
        }
      }

      if (music.id) {
        logger.info(
          'Music is already monitored in Lidarr. Skipping add and returning success',
          { label: 'Lidarr' }
        );
        return music;
      }

      const response = await this.axios.post<LidarrMusic>(`/music`, {
        title: options.title,
        qualityProfileId: options.qualityProfileId,
        profileId: options.profileId,
        titleSlug: options.mbId.toString(),
        mbId: options.mbId,
        year: options.year,
        rootFolderPath: options.rootFolderPath,
        monitored: options.monitored,
        tags: options.tags,
        addOptions: {
          searchForMusic: options.searchNow,
        },
      });

      if (response.data.id) {
        logger.info('Lidarr accepted request', { label: 'Lidarr' });
        logger.debug('Lidarr add details', {
          label: 'Lidarr',
          music: response.data,
        });
      } else {
        logger.error('Failed to add music to Lidarr', {
          label: 'Lidarr',
          options,
        });
        throw new Error('Failed to add music to Lidarr');
      }
      return response.data;
    } catch (e) {
      logger.error(
        'Failed to add music to Lidarr. This might happen if the music already exists, in which case you can safely ignore this error.',
        {
          label: 'Lidarr',
          errorMessage: e.message,
          options,
          response: e?.response?.data,
        }
      );
      throw new Error('Failed to add music to Lidarr');
    }
  };

  public async searchMusic(musicId: number): Promise<void> {
    logger.info('Executing music search command', {
      label: 'Lidarr API',
      musicId,
    });

    try {
      await this.runCommand('MusicsSearch', { musicIds: [musicId] });
    } catch (e) {
      logger.error(
        'Something went wrong while executing Lidarr music search.',
        {
          label: 'Lidarr API',
          errorMessage: e.message,
          musicId,
        }
      );
    }
  }
}

export default LidarrAPI;
