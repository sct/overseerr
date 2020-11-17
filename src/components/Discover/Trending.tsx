import React, { useContext } from 'react';
import { useSWRInfinite } from 'swr';
import type {
  MovieResult,
  TvResult,
  PersonResult,
} from '../../../server/models/Search';
import ListView from '../Common/ListView';
import { LanguageContext } from '../../context/LanguageContext';
import { defineMessages, FormattedMessage } from 'react-intl';
import Header from '../Common/Header';

const messages = defineMessages({
  trending: 'Trending',
});

interface SearchResult {
  page: number;
  totalResults: number;
  totalPages: number;
  results: (MovieResult | TvResult | PersonResult)[];
}

const Trending: React.FC = () => {
  const { locale } = useContext(LanguageContext);
  const { data, error, size, setSize } = useSWRInfinite<SearchResult>(
    (pageIndex: number, previousPageData: SearchResult | null) => {
      if (previousPageData && pageIndex + 1 > previousPageData.totalPages) {
        return null;
      }

      return `/api/v1/discover/trending?page=${
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

  const titles = data?.reduce(
    (a, v) => [...a, ...v.results],
    [] as (MovieResult | TvResult | PersonResult)[]
  );

  const isEmpty = !isLoadingInitialData && titles?.length === 0;
  const isReachingEnd =
    isEmpty || (data && data[data.length - 1]?.results.length < 20);

  return (
    <>
      <Header>
        <FormattedMessage {...messages.trending} />
      </Header>
      <ListView
        items={titles}
        isEmpty={isEmpty}
        isLoading={
          isLoadingInitialData || (isLoadingMore && (titles?.length ?? 0) > 0)
        }
        isReachingEnd={isReachingEnd}
        onScrollBottom={fetchMore}
      />
    </>
  );
};

export default Trending;
