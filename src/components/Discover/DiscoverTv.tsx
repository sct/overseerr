import React, { useContext } from 'react';
import useSWR, { useSWRInfinite } from 'swr';
import type { TvResult } from '../../../server/models/Search';
import ListView from '../Common/ListView';
import { defineMessages, useIntl } from 'react-intl';
import { LanguageContext } from '../../context/LanguageContext';
import Header from '../Common/Header';
import useSettings from '../../hooks/useSettings';
import { MediaStatus } from '../../../server/constants/media';
import PageTitle from '../Common/PageTitle';
import { useRouter } from 'next/router';
import {
  TmdbGenre,
  TmdbNetwork,
} from '../../../server/api/themoviedb/interfaces';

const messages = defineMessages({
  discovertv: 'Popular Series',
  genreSeries: '{genre} Series',
  networkSeries: '{network} Series',
});

interface SearchResult {
  page: number;
  totalResults: number;
  totalPages: number;
  results: TvResult[];
}

const DiscoverTv: React.FC = () => {
  const router = useRouter();
  const intl = useIntl();
  const settings = useSettings();
  const { locale } = useContext(LanguageContext);

  const { data: genres } = useSWR<TmdbGenre[]>('/api/v1/genres/tv');
  const genre = genres?.find((g) => g.id === Number(router.query.genreId));

  const { data: network } = useSWR<TmdbNetwork>(
    `/api/v1/network/${router.query.networkId}`
  );

  const { data, error, size, setSize } = useSWRInfinite<SearchResult>(
    (pageIndex: number, previousPageData: SearchResult | null) => {
      if (previousPageData && pageIndex + 1 > previousPageData.totalPages) {
        return null;
      }

      return `/api/v1/discover/tv?page=${pageIndex + 1}&language=${locale}${
        genre ? `&genre=${genre.id}` : ''
      }${network ? `&network=${network.id}` : ''}`;
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

  let titles = (data ?? []).reduce(
    (a, v) => [...a, ...v.results],
    [] as TvResult[]
  );

  if (settings.currentSettings.hideAvailable) {
    titles = titles.filter(
      (i) =>
        i.mediaInfo?.status !== MediaStatus.AVAILABLE &&
        i.mediaInfo?.status !== MediaStatus.PARTIALLY_AVAILABLE
    );
  }

  const isEmpty = !isLoadingInitialData && titles?.length === 0;
  const isReachingEnd =
    isEmpty || (data && data[data.length - 1]?.results.length < 20);

  const title = genre
    ? intl.formatMessage(messages.genreSeries, { genre: genre.name })
    : network
    ? intl.formatMessage(messages.networkSeries, { network: network.name })
    : intl.formatMessage(messages.discovertv);

  return (
    <>
      <PageTitle title={title} />
      <div className="mt-1 mb-5">
        <Header>{title}</Header>
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

export default DiscoverTv;
