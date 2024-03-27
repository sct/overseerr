import type { MediaType, SecondaryType } from '@server/constants/media';
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
  seasons?: number[] | 'all';
  is4k?: boolean;
  tvdbId?: number;
}

export interface TvRequestBody extends VideoRequestBody {
  mediaType: MediaType.TV;
}

export interface MusicRequestBody extends MediaRequestBody {
  secondaryType: SecondaryType;
  mediaType: MediaType.MUSIC;
  mediaId: string;
}
