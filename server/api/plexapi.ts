import NodePlexAPI from 'plex-api';
import { getSettings } from '../lib/settings';

export interface PlexLibraryItem {
  ratingKey: string;
  title: string;
  guid: string;
  type: 'movie' | 'show';
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
}

interface PlexLibrariesResponse {
  MediaContainer: {
    Directory: PlexLibrary[];
  };
}

export interface PlexMetadata {
  ratingKey: string;
  guid: string;
  type: 'movie' | 'show';
  title: string;
  Guid: {
    id: string;
  }[];
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
      post: settings.plex.port,
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

  public async getMetadata(key: string): Promise<PlexMetadata> {
    const response = await this.plexClient.query<PlexMetadataResponse>(
      `/library/metadata/${key}`
    );

    return response.MediaContainer.Metadata[0];
  }

  public async getRecentlyAdded() {
    const response = await this.plexClient.query('/library/recentlyAdded');

    return response;
  }
}

export default PlexAPI;
