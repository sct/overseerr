import React, { useContext } from 'react';
import { useSWRInfinite } from 'swr';
import type { TvResult } from '../../../server/models/Search';
import ListView from '../Common/ListView';
import { useRouter } from 'next/router';
import { LanguageContext } from '../../context/LanguageContext';

interface SearchResult {
  page: number;
  totalResults: number;
  totalPages: number;
  results: TvResult[];
}

const TvRecommendations: React.FC = () => {
  const { locale } = useContext(LanguageContext);
  const router = useRouter();
  const { data, error, size, setSize } = useSWRInfinite<SearchResult>(
    (pageIndex: number, previousPageData: SearchResult | null) => {
      if (previousPageData && pageIndex + 1 > previousPageData.totalPages) {
        return null;
      }

      return `/api/v1/tv/${router.query.tvId}/recommendations?page=${
        pageIndex + 1
      }&language=${locale}`;
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

  const isEmpty = !isLoadingInitialData && titles?.length === 0;
  const isReachingEnd =
    isEmpty || (data && data[data.length - 1]?.results.length < 20);

  return (
    <>
      <div className="md:flex md:items-center md:justify-between mb-8 mt-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl leading-7 text-white sm:text-2xl sm:leading-9 sm:truncate">
            Recommendations
          </h2>
        </div>
      </div>
      <ListView
        items={titles}
        isEmpty={isEmpty}
        isReachingEnd={isReachingEnd}
        isLoading={
          isLoadingInitialData || (isLoadingMore && (titles?.length ?? 0) > 0)
        }
        onScrollBottom={fetchMore}
      />
    </>
  );
};

export default TvRecommendations;
