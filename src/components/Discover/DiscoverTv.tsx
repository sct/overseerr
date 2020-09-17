import React from 'react';
import { useSWRInfinite } from 'swr';
import { TvResult } from '../../../server/models/Search';
import ListView from '../Common/ListView';

interface SearchResult {
  page: number;
  totalResults: number;
  totalPages: number;
  results: TvResult[];
}

const DiscoverTv: React.FC = () => {
  const { data, error, size, setSize } = useSWRInfinite<SearchResult>(
    (pageIndex: number, previousPageData: SearchResult | null) => {
      if (previousPageData && pageIndex + 1 > previousPageData.totalPages) {
        return null;
      }

      return `/api/v1/discover/tv?page=${pageIndex + 1}`;
    },
    {
      initialSize: 3,
    }
  );

  const isLoadingInitialData = !data && !error;
  const isLoadingMore =
    isLoadingInitialData ||
    (size > 0 && data && typeof data[size - 1] === 'undefined');

  const fetchMore = () => {
    setSize(size + 1);
  };

  if (error) {
    return <div>{error}</div>;
  }

  const titles = data?.reduce((a, v) => [...a, ...v.results], [] as TvResult[]);

  return (
    <>
      <div className="md:flex md:items-center md:justify-between mb-8 mt-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl leading-7 text-white sm:text-2xl sm:leading-9 sm:truncate">
            Discover Series
          </h2>
        </div>
      </div>
      <ListView
        items={titles}
        isEmpty={!isLoadingInitialData && titles?.length === 0}
        isLoading={
          isLoadingInitialData || (isLoadingMore && (titles?.length ?? 0) > 0)
        }
        onScrollBottom={fetchMore}
      />
    </>
  );
};

export default DiscoverTv;
