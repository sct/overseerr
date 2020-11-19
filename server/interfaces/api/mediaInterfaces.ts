import type Media from '../../entity/Media';

export interface MediaResultsResponse {
  pageInfo: {
    pages: number;
    page: number;
    results: number;
    pageSize: number;
  };
  results: Media[];
}
