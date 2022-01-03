import type Media from '../../entity/Media';
import { User } from '../../entity/User';
import { PaginatedResponse } from './common';

export interface MediaResultsResponse extends PaginatedResponse {
  results: Media[];
}

export interface MediaWatchDataResponse {
  data?: {
    playCount: number;
    playDuration: string;
    userCount: number;
    users: User[];
  };
  data4k?: {
    playCount: number;
    playDuration: string;
    userCount: number;
    users: User[];
  };
}
