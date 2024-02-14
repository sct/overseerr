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
  constructor({ url, apiKey }: { url: string; apiKey: string }) {
    super({ url, apiKey, cacheName: 'lidarr', apiName: 'Lidarr' });
  }

  public getArtists = async (): Promise<LidarrArtist[]> => {
    try {
      const response = await this.axios.get<LidarrArtist[]>('/artist');

      return response.data;
    } catch (e) {
      throw new Error(`[Lidarr] Failed to retrieve musics: ${e.message}`);
    }
  };

  public async getAlbum({ mbId }: { mbId: string }): Promise<LidarrAlbum[]> {
    try {
      const response = await this.axios.get<LidarrAlbum[]>('/album', {
        params: {
          foreignAlbumId: mbId,
        },
      });
      if (response.data.length > 0) {
        return response.data;
      }
      throw new Error('Album not found');
    } catch (e) {
      logger.error('Error retrieving album by MUSICBRAINZ ID', {
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
      const albums = await this.getAlbum({ mbId: options.mbId.toString() });
      if (albums.length > 0) {
        logger.info(
          'Album is already monitored in Lidarr. Skipping add and returning success',
          { label: 'Lidarr' }
        );
        return albums[0];
      }
      const response = await this.axios.put<LidarrAlbum>('/album', {
        params: { id: options.mbId },
      });
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
}

export default LidarrAPI;
