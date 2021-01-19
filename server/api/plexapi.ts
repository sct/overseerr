import NodePlexAPI from 'plex-api';
import { getSettings } from '../lib/settings';

export interface PlexLibraryItem {
  ratingKey: string;
  parentRatingKey?: string;
  grandparentRatingKey?: string;
  title: string;
  guid: string;
  parentGuid?: string;
  grandparentGuid?: string;
  addedAt: number;
  updatedAt: number;
  type: 'movie' | 'show' | 'season' | 'episode';
}

interface PlexLibraryResponse {
  MediaContainer: {
    Metadata: PlexLibraryItem[];
  };
}

export interface PlexLibrary {
  type: 'show' | 'movie';
  key: string;
  title: string;
  agent: string;
}

interface PlexLibrariesResponse {
  MediaContainer: {
    Directory: PlexLibrary[];
  };
}

export interface PlexMetadata {
  ratingKey: string;
  parentRatingKey?: string;
  guid: string;
  type: 'movie' | 'show' | 'season';
  title: string;
  Guid: {
    id: string;
  }[];
  Children?: {
    size: 12;
    Metadata: PlexMetadata[];
  };
  index: number;
  parentIndex?: number;
  leafCount: number;
  viewedLeafCount: number;
  addedAt: number;
  updatedAt: number;
  Media: Media[];
}

interface Media {
  id: number;
  duration: number;
  bitrate: number;
  width: number;
  height: number;
  aspectRatio: number;
  audioChannels: number;
  audioCodec: string;
  videoCodec: string;
  videoResolution: string;
  container: string;
  videoFrameRate: string;
  videoProfile: string;
}

interface PlexMetadataResponse {
  MediaContainer: {
    Metadata: PlexMetadata[];
  };
}

class PlexAPI {
  private plexClient: NodePlexAPI;

  constructor({ plexToken }: { plexToken?: string }) {
    const settings = getSettings();

    this.plexClient = new NodePlexAPI({
      hostname: settings.plex.ip,
      port: settings.plex.port,
      https: settings.plex.useSsl,
      token: plexToken,
      authenticator: {
        authenticate: (
          _plexApi,
          cb: (err?: string, token?: string) => void
        ) => {
          if (!plexToken) {
            return cb('Plex Token not found!');
          }
          cb(undefined, plexToken);
        },
      },
      // requestOptions: {
      //   includeChildren: 1,
      // },
      options: {
        identifier: settings.clientId,
        product: 'Overseerr',
        deviceName: 'Overseerr',
        platform: 'Overseerr',
      },
    });
  }

  public async getStatus() {
    return await this.plexClient.query('/');
  }

  public async getLibraries(): Promise<PlexLibrary[]> {
    const response = await this.plexClient.query<PlexLibrariesResponse>(
      '/library/sections'
    );

    return response.MediaContainer.Directory;
  }

  public async getLibraryContents(id: string): Promise<PlexLibraryItem[]> {
    const response = await this.plexClient.query<PlexLibraryResponse>(
      `/library/sections/${id}/all`
    );

    return response.MediaContainer.Metadata;
  }

  public async getMetadata(
    key: string,
    options: { includeChildren?: boolean } = {}
  ): Promise<PlexMetadata> {
    const response = await this.plexClient.query<PlexMetadataResponse>(
      `/library/metadata/${key}${
        options.includeChildren ? '?includeChildren=1' : ''
      }`
    );

    return response.MediaContainer.Metadata[0];
  }

  public async getChildrenMetadata(key: string): Promise<PlexMetadata[]> {
    const response = await this.plexClient.query<PlexMetadataResponse>(
      `/library/metadata/${key}/children`
    );

    return response.MediaContainer.Metadata;
  }

  public async getRecentlyAdded(id: string): Promise<PlexLibraryItem[]> {
    const response = await this.plexClient.query<PlexLibraryResponse>(
      `/library/sections/${id}/recentlyAdded`
    );

    return response.MediaContainer.Metadata;
  }
}

export default PlexAPI;
