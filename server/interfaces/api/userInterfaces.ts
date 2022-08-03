import type Media from '../../entity/Media';
import type { MediaRequest } from '../../entity/MediaRequest';
import type { User } from '../../entity/User';
import type { PaginatedResponse } from './common';

export interface UserResultsResponse extends PaginatedResponse {
  results: User[];
}

export interface UserRequestsResponse extends PaginatedResponse {
  results: MediaRequest[];
}

export interface QuotaStatus {
  days?: number;
  limit?: number;
  used: number;
  remaining?: number;
  restricted: boolean;
}

export interface QuotaResponse {
  movie: QuotaStatus;
  tv: QuotaStatus;
}
export interface UserWatchDataResponse {
  recentlyWatched: Media[];
  playCount: number;
}
