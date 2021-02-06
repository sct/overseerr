import { MediaRequest } from '../../entity/MediaRequest';
import { PaginatedResponse } from './common';

export interface UserRequestsResponse extends PaginatedResponse {
  results: MediaRequest[];
}
