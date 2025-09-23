import type { MediaType } from '@server/constants/media';
import type { MediaRequest } from '@server/entity/MediaRequest';
import type { PaginatedResponse } from './common';

export interface RequestResultsResponse extends PaginatedResponse {
  results: MediaRequest[];
}

export type SeasonRequestInput = {
  seasonNumber: number;
  episodes: number[] | 'all';
};

export type MediaRequestBody = {
  mediaType: MediaType;
  mediaId: number;
  tvdbId?: number;
  seasons?: number[] | 'all' | SeasonRequestInput[];
  is4k?: boolean;
  serverId?: number;
  profileId?: number;
  rootFolder?: string;
  languageProfileId?: number;
  userId?: number;
  tags?: number[];
};
