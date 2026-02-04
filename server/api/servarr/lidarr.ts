import logger from '@server/logger';
import ServarrBase from './base';

export interface LidarrArtistOptions {
  artistName: string;
  qualityProfileId: number;
  metadataProfileId: number;
  rootFolderPath: string;
  foreignArtistId: string; // MusicBrainz ID
  monitored?: boolean;
  searchNow?: boolean;
  tags?: number[];
  addOptions?: {
    monitor?:
      | 'all'
      | 'future'
      | 'missing'
      | 'existing'
      | 'first'
      | 'latest'
      | 'none';
    searchForMissingAlbums?: boolean;
  };
}

export interface LidarrAlbumOptions {
  title: string;
  qualityProfileId: number;
  foreignAlbumId: string; // MusicBrainz Release Group ID
  foreignArtistId: string; // MusicBrainz Artist ID
  rootFolderPath: string;
  monitored?: boolean;
  searchNow?: boolean;
  tags?: number[];
}

export interface LidarrArtist {
  id: number;
  artistMetadataId: number;
  status: string;
  ended: boolean;
  artistName: string;
  foreignArtistId: string; // MusicBrainz ID
  mbId?: string;
  tadbId?: number;
  discogsId?: number;
  allMusicId?: string;
  overview?: string;
  artistType?: string;
  disambiguation?: string;
  links?: {
    url: string;
    name: string;
  }[];
  images?: {
    coverType: string;
    url: string;
  }[];
  remotePoster?: string;
  path: string;
  qualityProfileId: number;
  metadataProfileId: number;
  monitored: boolean;
  monitorNewItems?: 'all' | 'none' | 'new';
  rootFolderPath: string;
  folder?: string;
  tags: number[];
  added: string;
  statistics?: {
    albumCount: number;
    trackFileCount: number;
    trackCount: number;
    totalTrackCount: number;
    sizeOnDisk: number;
    percentOfTracks: number;
  };
  addOptions?: {
    monitor?:
      | 'all'
      | 'future'
      | 'missing'
      | 'existing'
      | 'first'
      | 'latest'
      | 'none';
    searchForMissingAlbums?: boolean;
  };
}

export interface LidarrAlbum {
  id: number;
  title: string;
  disambiguation?: string;
  overview?: string;
  artistId: number;
  artist?: LidarrArtist;
  foreignAlbumId: string; // MusicBrainz Release Group ID
  foreignArtistId: string; // MusicBrainz Artist ID
  monitored: boolean;
  anyReleaseOk: boolean;
  profileId: number;
  duration: number;
  albumType: string;
  secondaryTypes?: string[];
  mediumCount: number;
  ratings?: {
    votes: number;
    value: number;
  };
  releaseDate?: string;
  releases?: {
    id: number;
    albumId: number;
    foreignReleaseId: string;
    title: string;
    status: string;
    duration: number;
    trackCount: number;
    media: {
      mediumNumber: number;
      mediumFormat: string;
      name: string;
    }[];
    disambiguation?: string;
    country?: string[];
    label?: string[];
    format?: string;
    monitored: boolean;
    trackFiles?: {
      id: number;
      path: string;
      size: number;
      dateAdded: string;
      quality: {
        quality: {
          id: number;
          name: string;
        };
        revision: {
          version: number;
          real: number;
          isRepack: boolean;
        };
      };
    }[];
  }[];
  images?: {
    coverType: string;
    url: string;
  }[];
  remoteCover?: string;
  links?: {
    url: string;
    name: string;
  }[];
  genres?: string[];
  tags: number[];
  addOptions?: {
    searchForNewAlbum?: boolean;
  };
  statistics?: {
    previousRelease?: string;
    trackFileCount: number;
    trackCount: number;
    totalTrackCount: number;
    sizeOnDisk: number;
    percentOfTracks: number;
  };
}

class LidarrAPI extends ServarrBase<{ artistId: number; albumId: number }> {
  constructor({ url, apiKey }: { url: string; apiKey: string }) {
    super({
      url,
      apiKey,
      cacheName: 'lidarr',
      apiName: 'Lidarr',
    });
  }

  public getArtists = async (): Promise<LidarrArtist[]> => {
    try {
      const response = await this.axios.get<LidarrArtist[]>('/artist');

      return response.data;
    } catch (e) {
      throw new Error(`[Lidarr] Failed to retrieve artists: ${e.message}`);
    }
  };

  public getArtist = async ({ id }: { id: number }): Promise<LidarrArtist> => {
    try {
      const response = await this.axios.get<LidarrArtist>(`/artist/${id}`);

      return response.data;
    } catch (e) {
      throw new Error(`[Lidarr] Failed to retrieve artist: ${e.message}`);
    }
  };

  public async getArtistByMusicBrainzId(
    mbid: string
  ): Promise<LidarrArtist | null> {
    try {
      const response = await this.axios.get<LidarrArtist[]>('/artist/lookup', {
        params: {
          term: `mbid:${mbid}`,
        },
      });

      if (!response.data || response.data.length === 0) {
        return null;
      }

      return response.data[0];
    } catch (e) {
      logger.error('Error retrieving artist by MusicBrainz ID', {
        label: 'Lidarr API',
        errorMessage: e.message,
        mbid,
      });
      return null;
    }
  }

  public addArtist = async (
    options: LidarrArtistOptions
  ): Promise<LidarrArtist> => {
    try {
      const existingArtist = await this.getArtistByMusicBrainzId(
        options.foreignArtistId
      );

      if (existingArtist?.id) {
        if (existingArtist.monitored) {
          logger.info(
            'Artist is already monitored in Lidarr. Skipping add and returning success',
            { label: 'Lidarr' }
          );
          return existingArtist;
        }

        // Update existing artist to monitored
        const response = await this.axios.put<LidarrArtist>(`/artist`, {
          ...existingArtist,
          monitored: options.monitored ?? true,
          tags: options.tags
            ? Array.from(new Set([...existingArtist.tags, ...options.tags]))
            : existingArtist.tags,
          addOptions: options.addOptions,
        });

        if (response.data.monitored) {
          logger.info(
            'Found existing artist in Lidarr and set it to monitored.',
            {
              label: 'Lidarr',
              artistId: response.data.id,
              artistName: response.data.artistName,
            }
          );

          if (options.searchNow) {
            this.searchArtist(response.data.id);
          }

          return response.data;
        }
      }

      const response = await this.axios.post<LidarrArtist>(`/artist`, {
        artistName: options.artistName,
        foreignArtistId: options.foreignArtistId,
        qualityProfileId: options.qualityProfileId,
        metadataProfileId: options.metadataProfileId,
        rootFolderPath: options.rootFolderPath,
        monitored: options.monitored ?? true,
        tags: options.tags ?? [],
        addOptions: options.addOptions ?? {
          monitor: 'all',
          searchForMissingAlbums: options.searchNow ?? false,
        },
      });

      if (response.data.id) {
        logger.info('Lidarr accepted request', { label: 'Lidarr' });
        logger.debug('Lidarr add details', {
          label: 'Lidarr',
          artist: response.data,
        });
      } else {
        logger.error('Failed to add artist to Lidarr', {
          label: 'Lidarr',
          options,
        });
        throw new Error('Failed to add artist to Lidarr');
      }
      return response.data;
    } catch (e) {
      logger.error(
        'Failed to add artist to Lidarr. This might happen if the artist already exists, in which case you can safely ignore this error.',
        {
          label: 'Lidarr',
          errorMessage: e.message,
          options,
          response: e?.response?.data,
        }
      );
      throw new Error('Failed to add artist to Lidarr');
    }
  };

  public async searchArtist(artistId: number): Promise<void> {
    logger.info('Executing artist search command', {
      label: 'Lidarr API',
      artistId,
    });

    try {
      await this.runCommand('ArtistSearch', { artistId });
    } catch (e) {
      logger.error(
        'Something went wrong while executing Lidarr artist search.',
        {
          label: 'Lidarr API',
          errorMessage: e.message,
          artistId,
        }
      );
    }
  }

  public getAlbums = async (): Promise<LidarrAlbum[]> => {
    try {
      const response = await this.axios.get<LidarrAlbum[]>('/album');

      return response.data;
    } catch (e) {
      throw new Error(`[Lidarr] Failed to retrieve albums: ${e.message}`);
    }
  };

  public getAlbum = async ({ id }: { id: number }): Promise<LidarrAlbum> => {
    try {
      const response = await this.axios.get<LidarrAlbum>(`/album/${id}`);

      return response.data;
    } catch (e) {
      throw new Error(`[Lidarr] Failed to retrieve album: ${e.message}`);
    }
  };

  public async getAlbumByMusicBrainzId(
    mbid: string
  ): Promise<LidarrAlbum | null> {
    try {
      const response = await this.axios.get<LidarrAlbum[]>('/album/lookup', {
        params: {
          term: `rgid:${mbid}`,
        },
      });

      if (!response.data || response.data.length === 0) {
        return null;
      }

      return response.data[0];
    } catch (e) {
      logger.error('Error retrieving album by MusicBrainz ID', {
        label: 'Lidarr API',
        errorMessage: e.message,
        mbid,
      });
      return null;
    }
  }

  public addAlbum = async (
    options: LidarrAlbumOptions
  ): Promise<LidarrAlbum> => {
    try {
      const existingAlbum = await this.getAlbumByMusicBrainzId(
        options.foreignAlbumId
      );

      if (existingAlbum?.id) {
        if (existingAlbum.monitored) {
          logger.info(
            'Album is already monitored in Lidarr. Skipping add and returning success',
            { label: 'Lidarr' }
          );
          return existingAlbum;
        }

        // Update existing album to monitored
        const response = await this.axios.put<LidarrAlbum>(`/album`, {
          ...existingAlbum,
          monitored: options.monitored ?? true,
          tags: options.tags
            ? Array.from(new Set([...existingAlbum.tags, ...options.tags]))
            : existingAlbum.tags,
        });

        if (response.data.monitored) {
          logger.info(
            'Found existing album in Lidarr and set it to monitored.',
            {
              label: 'Lidarr',
              albumId: response.data.id,
              albumTitle: response.data.title,
            }
          );

          if (options.searchNow) {
            this.searchAlbum(response.data.id);
          }

          return response.data;
        }
      }

      const response = await this.axios.post<LidarrAlbum>(`/album`, {
        title: options.title,
        foreignAlbumId: options.foreignAlbumId,
        foreignArtistId: options.foreignArtistId,
        qualityProfileId: options.qualityProfileId,
        rootFolderPath: options.rootFolderPath,
        monitored: options.monitored ?? true,
        tags: options.tags ?? [],
        addOptions: {
          searchForNewAlbum: options.searchNow ?? false,
        },
      });

      if (response.data.id) {
        logger.info('Lidarr accepted request', { label: 'Lidarr' });
        logger.debug('Lidarr add details', {
          label: 'Lidarr',
          album: response.data,
        });
      } else {
        logger.error('Failed to add album to Lidarr', {
          label: 'Lidarr',
          options,
        });
        throw new Error('Failed to add album to Lidarr');
      }
      return response.data;
    } catch (e) {
      logger.error(
        'Failed to add album to Lidarr. This might happen if the album already exists, in which case you can safely ignore this error.',
        {
          label: 'Lidarr',
          errorMessage: e.message,
          options,
          response: e?.response?.data,
        }
      );
      throw new Error('Failed to add album to Lidarr');
    }
  };

  public async searchAlbum(albumId: number): Promise<void> {
    logger.info('Executing album search command', {
      label: 'Lidarr API',
      albumId,
    });

    try {
      await this.runCommand('AlbumSearch', { albumId });
    } catch (e) {
      logger.error(
        'Something went wrong while executing Lidarr album search.',
        {
          label: 'Lidarr API',
          errorMessage: e.message,
          albumId,
        }
      );
    }
  }

  public async getMetadataProfiles(): Promise<{ id: number; name: string }[]> {
    try {
      const data = await this.getRolling<{ id: number; name: string }[]>(
        `/metadataprofile`,
        undefined,
        3600
      );

      return data;
    } catch (e) {
      logger.error(
        'Something went wrong while retrieving Lidarr metadata profiles.',
        {
          label: 'Lidarr API',
          errorMessage: e.message,
        }
      );

      throw new Error('Failed to get metadata profiles');
    }
  }
}

export default LidarrAPI;
