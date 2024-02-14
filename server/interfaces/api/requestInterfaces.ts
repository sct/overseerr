import type { MediaType } from '@server/constants/media';
import type { MediaRequest } from '@server/entity/MediaRequest';
import type { PaginatedResponse } from './common';

export interface RequestResultsResponse extends PaginatedResponse {
  results: MediaRequest[];
}

interface MediaRequestBody {
  mediaType: MediaType;
  mediaId: number | string;
  serverId?: number;
  profileId?: number;
  rootFolder?: string;
  languageProfileId?: number;
  userId?: number;
  tags?: number[];
}

export interface VideoRequestBody extends MediaRequestBody {
  mediaType: MediaType.MOVIE | MediaType.TV;
  mediaId: number;
  is4k?: boolean;
}

export interface TvRequestBody extends VideoRequestBody {
  mediaType: MediaType.TV;
  tvdbId?: number;
  seasons?: number[] | 'all';
}

export interface MusicRequestBody extends MediaRequestBody {
  mediaType: MediaType.MUSIC;
  mediaId: string;
  albumId?: number;
  artistId?: number;
}
