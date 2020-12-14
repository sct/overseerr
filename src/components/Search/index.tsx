import React, { useContext } from 'react';
import { useRouter } from 'next/router';
import {
  TvResult,
  MovieResult,
  PersonResult,
} from '../../../server/models/Search';
import { useSWRInfinite } from 'swr';
import ListView from '../Common/ListView';
import { LanguageContext } from '../../context/LanguageContext';
import { defineMessages, useIntl } from 'react-intl';
import Header from '../Common/Header';

const messages = defineMessages({
  searchresults: 'Search Results',
});

interface SearchResult {
  page: number;
  totalResults: number;
  totalPages: number;
  results: (MovieResult | TvResult | PersonResult)[];
}

const Search: React.FC = () => {
  const intl = useIntl();
  const { locale } = useContext(LanguageContext);
  const router = useRouter();
  const { data, error, size, setSize } = useSWRInfinite<SearchResult>(
    (pageIndex: number, previousPageData: SearchResult | null) => {
      if (previousPageData && pageIndex + 1 > previousPageData.totalPages) {
        return null;
      }

      return `/api/v1/search/?query=${router.query.query}&page=${
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
      <Header>{intl.formatMessage(messages.searchresults)}</Header>
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

export default Search;
