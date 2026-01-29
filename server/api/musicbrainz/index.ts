import ExternalAPI from '@server/api/externalapi';
import type { AvailableCacheIds } from '@server/lib/cache';
import cacheManager from '@server/lib/cache';
import logger from '@server/logger';

export interface MusicBrainzArtist {
  id: string;
  name: string;
  'sort-name'?: string;
  disambiguation?: string;
  'life-span'?: {
    begin?: string;
    end?: string;
    ended?: boolean;
  };
  country?: string;
  type?: string;
  tags?: { name: string; count: number }[];
  'tag-list'?: { name: string; count: number }[];
  area?: {
    id: string;
    name: string;
  };
  'begin-area'?: {
    id: string;
    name: string;
  };
  'end-area'?: {
    id: string;
    name: string;
  };
  relations?: {
    type: string;
    'type-id': string;
    direction: string;
    artist?: {
      id: string;
      name: string;
    };
    url?: {
      resource: string;
    };
  }[];
  releases?: {
    id: string;
    title: string;
    'first-release-date'?: string;
  }[];
  'release-groups'?: {
    id: string;
    title: string;
    'primary-type'?: string;
    'first-release-date'?: string;
  }[];
}

export interface MusicBrainzReleaseGroup {
  id: string;
  title: string;
  'primary-type'?: string;
  'secondary-types'?: string[];
  'first-release-date'?: string;
  disambiguation?: string;
  'artist-credit'?: {
    artist: {
      id: string;
      name: string;
    };
    name?: string;
  }[];
  releases?: {
    id: string;
    title: string;
    date?: string;
    country?: string;
  }[];
  tags?: { name: string; count: number }[];
  'tag-list'?: { name: string; count: number }[];
  relations?: {
    type: string;
    'type-id': string;
    direction: string;
  }[];
}

export interface MusicBrainzRelease {
  id: string;
  title: string;
  date?: string;
  country?: string;
  'release-group'?: {
    id: string;
    title: string;
    'primary-type'?: string;
  };
  'artist-credit'?: {
    artist: {
      id: string;
      name: string;
    };
    name?: string;
  }[];
  'medium-count'?: number;
  'track-count'?: number;
  media?: {
    format?: string;
    'track-count'?: number;
    tracks?: {
      id: string;
      title: string;
      length?: number;
      position?: number;
    }[];
  }[];
  disambiguation?: string;
}

export interface MusicBrainzRecording {
  id: string;
  title: string;
  length?: number;
  disambiguation?: string;
  'first-release-date'?: string;
  'artist-credit'?: {
    artist: {
      id: string;
      name: string;
    };
    name?: string;
  }[];
  releases?: {
    id: string;
    title: string;
    date?: string;
    country?: string;
  }[];
}

export interface MusicBrainzSearchResponse<T> {
  created?: string;
  count: number;
  offset: number;
  artists?: T[];
  'release-groups'?: T[];
  releases?: T[];
  recordings?: T[];
  'artist-list'?: T[];
  'release-group-list'?: T[];
  'release-list'?: T[];
  'recording-list'?: T[];
}

class MusicBrainzAPI extends ExternalAPI {
  constructor() {
    super(
      'https://musicbrainz.org/ws/2',
      {},
      {
        headers: {
          'User-Agent': 'Overseerr/1.0 (https://github.com/sct/overseerr)',
          Accept: 'application/json',
        },
        rateLimit: {
          maxRPS: 1,
          maxRequests: 1,
        },
        nodeCache: cacheManager.getCache('musicbrainz' as AvailableCacheIds)
          ?.data,
      }
    );
  }

  public async searchArtists(
    query: string,
    limit = 25,
    offset = 0
  ): Promise<MusicBrainzSearchResponse<MusicBrainzArtist>> {
    try {
      const response = await this.get<
        MusicBrainzSearchResponse<MusicBrainzArtist>
      >(
        '/artist',
        {
          params: {
            query,
            limit,
            offset,
            fmt: 'json',
          },
        },
        3600 // Cache for 1 hour
      );

      return {
        ...response,
        'artist-list': response['artist-list'] ?? response.artists ?? [],
      };
    } catch (e) {
      logger.error('Failed to search artists on MusicBrainz', {
        label: 'MusicBrainz API',
        errorMessage: e.message,
        query,
      });
      throw new Error('Failed to search artists');
    }
  }

  public async getArtist(
    mbid: string,
    includes: string[] = ['releases', 'release-groups', 'tags', 'ratings']
  ): Promise<MusicBrainzArtist> {
    try {
      const response = await this.get<MusicBrainzArtist>(
        `/artist/${mbid}`,
        {
          params: {
            inc: includes.join('+'),
            fmt: 'json',
          },
        },
        3600 // Cache for 1 hour
      );

      return response;
    } catch (e) {
      logger.error('Failed to get artist from MusicBrainz', {
        label: 'MusicBrainz API',
        errorMessage: e.message,
        mbid,
      });
      throw new Error('Failed to get artist');
    }
  }

  public async searchReleaseGroups(
    query: string,
    limit = 25,
    offset = 0
  ): Promise<MusicBrainzSearchResponse<MusicBrainzReleaseGroup>> {
    try {
      const response = await this.get<
        MusicBrainzSearchResponse<MusicBrainzReleaseGroup>
      >(
        '/release-group',
        {
          params: {
            query,
            limit,
            offset,
            fmt: 'json',
          },
        },
        3600 // Cache for 1 hour
      );

      return {
        ...response,
        'release-group-list':
          response['release-group-list'] ?? response['release-groups'] ?? [],
      };
    } catch (e) {
      logger.error('Failed to search release groups on MusicBrainz', {
        label: 'MusicBrainz API',
        errorMessage: e.message,
        query,
      });
      throw new Error('Failed to search release groups');
    }
  }

  public async getReleaseGroup(
    mbid: string,
    includes: string[] = ['artists', 'releases', 'tags', 'ratings']
  ): Promise<MusicBrainzReleaseGroup> {
    try {
      const response = await this.get<MusicBrainzReleaseGroup>(
        `/release-group/${mbid}`,
        {
          params: {
            inc: includes.join('+'),
            fmt: 'json',
          },
        },
        3600 // Cache for 1 hour
      );

      return response;
    } catch (e) {
      logger.error('Failed to get release group from MusicBrainz', {
        label: 'MusicBrainz API',
        errorMessage: e.message,
        mbid,
      });
      throw new Error('Failed to get release group');
    }
  }

  public async searchReleases(
    query: string,
    limit = 25,
    offset = 0
  ): Promise<MusicBrainzSearchResponse<MusicBrainzRelease>> {
    try {
      const response = await this.get<
        MusicBrainzSearchResponse<MusicBrainzRelease>
      >(
        '/release',
        {
          params: {
            query,
            limit,
            offset,
            fmt: 'json',
          },
        },
        3600 // Cache for 1 hour
      );

      return {
        ...response,
        'release-list': response['release-list'] ?? response.releases ?? [],
      };
    } catch (e) {
      logger.error('Failed to search releases on MusicBrainz', {
        label: 'MusicBrainz API',
        errorMessage: e.message,
        query,
      });
      throw new Error('Failed to search releases');
    }
  }

  public async searchRecordings(
    query: string,
    limit = 25,
    offset = 0
  ): Promise<MusicBrainzSearchResponse<MusicBrainzRecording>> {
    try {
      const response = await this.get<
        MusicBrainzSearchResponse<MusicBrainzRecording>
      >(
        '/recording',
        {
          params: {
            query,
            limit,
            offset,
            fmt: 'json',
          },
        },
        3600 // Cache for 1 hour
      );

      return {
        ...response,
        'recording-list':
          response['recording-list'] ?? response.recordings ?? [],
      };
    } catch (e) {
      logger.error('Failed to search recordings on MusicBrainz', {
        label: 'MusicBrainz API',
        errorMessage: e.message,
        query,
      });
      throw new Error('Failed to search recordings');
    }
  }

  public async getRecording(
    mbid: string,
    includes: string[] = ['artists', 'releases']
  ): Promise<MusicBrainzRecording> {
    try {
      const response = await this.get<MusicBrainzRecording>(
        `/recording/${mbid}`,
        {
          params: {
            inc: includes.join('+'),
            fmt: 'json',
          },
        },
        3600 // Cache for 1 hour
      );

      return response;
    } catch (e) {
      logger.error('Failed to get recording from MusicBrainz', {
        label: 'MusicBrainz API',
        errorMessage: e.message,
        mbid,
      });
      throw new Error('Failed to get recording');
    }
  }

  public async getRelease(
    mbid: string,
    includes: string[] = ['artists', 'recordings', 'release-groups']
  ): Promise<MusicBrainzRelease> {
    try {
      const response = await this.get<MusicBrainzRelease>(
        `/release/${mbid}`,
        {
          params: {
            inc: includes.join('+'),
            fmt: 'json',
          },
        },
        3600 // Cache for 1 hour
      );

      return response;
    } catch (e) {
      logger.error('Failed to get release from MusicBrainz', {
        label: 'MusicBrainz API',
        errorMessage: e.message,
        mbid,
      });
      throw new Error('Failed to get release');
    }
  }

  public async getArtistAlbums(
    artistMbid: string,
    limit = 100,
    offset = 0
  ): Promise<MusicBrainzSearchResponse<MusicBrainzReleaseGroup>> {
    try {
      const response = await this.searchReleaseGroups(
        `arid:${artistMbid}`,
        limit,
        offset
      );

      return response;
    } catch (e) {
      logger.error('Failed to get artist albums from MusicBrainz', {
        label: 'MusicBrainz API',
        errorMessage: e.message,
        artistMbid,
      });
      throw new Error('Failed to get artist albums');
    }
  }
}

export default MusicBrainzAPI;
