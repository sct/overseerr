import logger from '@server/logger';
import ServarrBase from './base';

export interface LidarrAlbumOptions {
  profileId: number;
  qualityProfileId: number;
  rootFolderPath: string;
  title: string;
  mbId: string;
  monitored: boolean;
  tags: string[];
  searchNow: boolean;
}

export interface LidarrArtistOptions {
  profileId: number;
  qualityProfileId: number;
  rootFolderPath: string;
  mbId: string;
  monitored: boolean;
  tags: string[];
  searchNow: boolean;
  monitorNewItems: string;
  monitor: string;
  searchForMissingAlbums: boolean;
}

export interface LidarrMusic {
  id: number;
  title: string;
  isAvailable: boolean;
  monitored: boolean;
  mbId: number;
  titleSlug: string;
  folderName: string;
  path: string;
  profileId: number;
  qualityProfileId: number;
  added: string;
  hasFile: boolean;
}

export interface LidarrAlbum {
  title: string;
  disambiguation: string;
  overview: string;
  artistId: number;
  foreignAlbumId: string;
  monitored: boolean;
  anyReleaseOk: boolean;
  profileId: number;
  duration: number;
  albumType: string;
  secondaryTypes: string[];
  mediumCount: number;
  ratings: Ratings;
  releaseDate: string;
  releases: LidarrRelease[];
  genres: string[];
  media: Medium[];
  artist: LidarrArtist;
  images: Image[];
  links: Link[];
  statistics: Statistics;
  grabbed: boolean;
  id: number;
}

export interface LidarrArtist {
  addOptions?: { monitor: string; searchForMissingAlbums: boolean };
  artistMetadataId: number;
  status: string;
  ended: boolean;
  artistName: string;
  foreignArtistId: string;
  tadbId: number;
  discogsId: number;
  overview: string;
  artistType: string;
  disambiguation: string;
  links: Link[];
  images: Image[];
  path: string;
  qualityProfileId: number;
  metadataProfileId: number;
  monitored: boolean;
  monitorNewItems: string;
  rootFolderPath?: string;
  genres: string[];
  cleanName: string;
  sortName: string;
  tags: Tag[];
  added: string;
  ratings: Ratings;
  statistics: Statistics;
  id: number;
}

export interface LidarrRelease {
  id: number;
  albumId: number;
  foreignReleaseId: string;
  title: string;
  status: string;
  duration: number;
  trackCount: number;
  media: Medium[];
  mediumCount: number;
  disambiguation: string;
  country: string[];
  label: string[];
  format: string;
  monitored: boolean;
}

export interface Link {
  url: string;
  name: string;
}

export interface Ratings {
  votes: number;
  value: number;
}

export interface Statistics {
  albumCount?: number;
  trackFileCount: number;
  trackCount: number;
  totalTrackCount: number;
  sizeOnDisk: number;
  percentOfTracks: number;
}

export interface Image {
  url: string;
  coverType: string;
  extension: string;
  remoteUrl: string;
}

export interface Tag {
  name: string;
  count: number;
}

export interface Medium {
  mediumNumber: number;
  mediumName: string;
  mediumFormat: string;
}

class LidarrAPI extends ServarrBase<{ musicId: number }> {
  static lastArtistsUpdate = 0;
  static artists: LidarrArtist[] = [];
  static delay = 1000 * 60;
  constructor({ url, apiKey }: { url: string; apiKey: string }) {
    super({ url, apiKey, cacheName: 'lidarr', apiName: 'Lidarr' });
    if (LidarrAPI.lastArtistsUpdate < Date.now() - LidarrAPI.delay) {
      this.getArtists();
    }
  }

  public getArtists = (): void => {
    try {
      LidarrAPI.lastArtistsUpdate = Date.now();
      this.axios.get<LidarrArtist[]>('/artist').then((response) => {
        LidarrAPI.artists = response.data;
      });
    } catch (e) {
      throw new Error(`[Lidarr] Failed to retrieve artists: ${e.message}`);
    }
  };

  public getArtist = async (id: string | number): Promise<LidarrArtist> => {
    try {
      if (LidarrAPI.lastArtistsUpdate < Date.now() - LidarrAPI.delay) {
        this.getArtists();
      }
      if (typeof id === 'number') {
        const result = LidarrAPI.artists.find((artist) => artist.id === id);
        if (result) {
          return result;
        }
        throw new Error(`Artist not found (using Lidarr Id): ${id}`);
      }
      const result = LidarrAPI.artists.find(
        (artist) => artist.foreignArtistId === id
      );
      if (result) {
        return result;
      }
      const artist = await this.getArtistByMusicBrainzId(id);
      if (artist) {
        return artist;
      }
      throw new Error(`Artist not found (using MusicBrainz Id): ${id}`);
    } catch (e) {
      throw new Error(`[Lidarr] ${e.message}`);
    }
  };

  public async getArtistByMusicBrainzId(mbId: string): Promise<LidarrArtist> {
    try {
      const response = await this.axios.get<LidarrArtist[]>('/artist/lookup', {
        params: {
          term: `mbid:` + mbId,
        },
      });
      if (!response.data[0]) {
        throw new Error('Artist not found');
      }

      return response.data[0];
    } catch (e) {
      logger.error('Error retrieving artist by MusicBrainz ID', {
        label: 'Lidarr API',
        errorMessage: e.message,
        mbId: mbId,
      });
      throw new Error('Artist not found');
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

  public async getAlbum({
    artistId,
    albumId,
  }: {
    artistId?: number;
    foreignAlbumId?: string;
    albumId?: number;
  }): Promise<LidarrAlbum[]> {
    try {
      const response = await this.axios.get<LidarrAlbum[]>('/album', {
        params: {
          artistId,
          albumId,
        },
      });
      return response.data;
    } catch (e) {
      throw new Error(`[Lidarr] Failed to retrieve album: ${e.message}`);
    }
  }

  public async getAlbumByMusicBrainzId(mbId: string): Promise<LidarrAlbum> {
    try {
      const response = await this.axios.get<LidarrAlbum[]>('/album/lookup', {
        params: {
          term: `mbid:` + mbId,
        },
      });
      if (!response.data[0]) {
        throw new Error('Album not found');
      }

      return response.data[0];
    } catch (e) {
      logger.error('Error retrieving album by MusicBrainz ID', {
        label: 'Lidarr API',
        errorMessage: e.message,
        mbId: mbId,
      });
      throw new Error('Album not found');
    }
  }

  public addAlbum = async (
    options: LidarrAlbumOptions
  ): Promise<LidarrAlbum> => {
    try {
      const album = await this.getAlbumByMusicBrainzId(options.mbId);
      let response;
      if (!album.id) {
        logger.info(
          'Album is not already in Lidarr. Monitoring it and downloading.',
          { label: 'Lidarr' }
        );
        const settings = {
          ...album,
          artistId: album.artistId ?? 0,
          foreignAlbumId: options.mbId,
          monitored: true,
          anyReleaseOk: true,
          profileId: options.profileId,
          artist: {
            ...album.artist,
            qualityProfileId: options.qualityProfileId,
            monitored: true,
            monitorNewItems: 'none',
            folder: album.artist.artistName,
            added: '0001-01-01T00:00:00Z',
            addOptions: {
              searchForMissingAlbums: true,
            },
            rootFolderPath: options.rootFolderPath,
            images: [],
            links: [],
          },
          addOptions: {
            searchForNewAlbum: options.searchNow,
          },
        };
        response = await this.axios.post<LidarrAlbum>(`album/`, settings);

        if (response.data.id) {
          logger.info('Lidarr accepted request', { label: 'Lidarr' });
          return response.data;
        } else {
          logger.error('Failed to add album to Lidarr', {
            label: 'Lidarr',
            options,
          });
          throw new Error('Failed to add album to Lidarr');
        }
      }
      logger.info('Monitoring album in Lidarr', { label: 'Lidarr' });
      response = await this.axios.put(`/album/monitor`, {
        albumIds: [album.id],
        monitored: true,
      });

      if (response.data[0].id) {
        logger.info('Lidarr accepted request', { label: 'Lidarr' });
      } else {
        logger.error('Failed to monitor album in Lidarr', {
          label: 'Lidarr',
          options,
        });
        throw new Error('Failed to monitor album in Lidarr');
      }

      logger.info('Starting search for monitored album in Lidarr.', {
        label: 'Lidarr',
      });

      response = await this.axios.post(`/command`, {
        name: 'AlbumSearch',
        albumIds: [album.id],
      });

      if (response.data.id) {
        logger.info('Lidarr accepted download request', { label: 'Lidarr' });
      } else {
        logger.error('Lidarr refused download request', {
          label: 'Lidarr',
          options,
        });
        throw new Error('Lidarr refused download request');
      }
      return response.data;
    } catch (e) {
      logger.error('Error adding album by MUSICBRAINZ ID', {
        label: 'Lidarr API',
        errorMessage: e.message,
        mbId: options.mbId,
      });
      throw new Error(`[Lidarr] Failed to add album: ${options.mbId}`);
    }
  };

  public addArtist = async (
    options: LidarrArtistOptions
  ): Promise<LidarrArtist> => {
    try {
      const artist = await this.getArtistByMusicBrainzId(options.mbId);
      if (artist.id) {
        logger.info('Artist is already monitored in Lidarr. Skipping add.', {
          label: 'Lidarr',
          artistId: artist.id,
          artistName: artist.artistName,
        });
        return artist;
      }

      const response = await this.axios.post<LidarrArtist>('/artist', {
        ...artist,
        qualityProfileId: options.qualityProfileId,
        metadataProfileId: options.profileId,
        monitored: true,
        monitorNewItems: options.monitorNewItems,
        rootFolderPath: options.rootFolderPath,
        addOptions: {
          monitor: options.monitor, //all,future,missing,existing,first,latest,none
          searchForMissingAlbums: options.searchForMissingAlbums,
        },
      });

      if (response.data.id) {
        logger.info('Lidarr accepted request', { label: 'Lidarr' });
      } else {
        logger.error('Failed to add artist to Lidarr', {
          label: 'Lidarr',
          mbId: options.mbId,
        });
        throw new Error('Failed to add artist to Lidarr');
      }
      return response.data;
    } catch (e) {
      logger.error('Error adding artist by MUSICBRAINZ ID', {
        label: 'Lidarr API',
        errorMessage: e.message,
        mbId: options.mbId,
      });
      throw new Error(`[Lidarr] Failed to add artist: ${options.mbId}`);
    }
  };
}

export default LidarrAPI;
