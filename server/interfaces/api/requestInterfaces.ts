import type { MediaType } from '@server/constants/media';
import type { MediaRequest } from '@server/entity/MediaRequest';
import type { PaginatedResponse } from './common';

export interface RequestResultsResponse extends PaginatedResponse {
  results: MediaRequest[];
}

export type MediaRequestBody = {
  mediaType: MediaType;
  mediaId: number;
  musicBrainzId?: string; // For music requests
  tvdbId?: number;
  seasons?: number[] | 'all';
  is4k?: boolean;
  serverId?: number;
  profileId?: number;
  rootFolder?: string;
  languageProfileId?: number;
  metadataProfileId?: number; // For Lidarr
  userId?: number;
  tags?: number[];
};
