import type { PaginatedResponse } from './common';
import type { MediaRequest } from '../../entity/MediaRequest';
import type { MediaType } from '../../constants/media';

export interface RequestResultsResponse extends PaginatedResponse {
  results: MediaRequest[];
}

export type MediaRequestBody = {
  mediaType: MediaType;
  mediaId: number;
  tvdbId?: number;
  seasons?: number[] | 'all';
  is4k?: boolean;
  serverId?: number;
  profileId?: number;
  rootFolder?: string;
  languageProfileId?: number;
  userId?: number;
  tags?: number[];
};
