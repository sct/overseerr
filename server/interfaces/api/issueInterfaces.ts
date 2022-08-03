import type Issue from '../../entity/Issue';
import type { PaginatedResponse } from './common';

export interface IssueResultsResponse extends PaginatedResponse {
  results: Issue[];
}
