import React, { useContext } from 'react';
import useSWR, { useSWRInfinite } from 'swr';
import type { MovieResult } from '../../../server/models/Search';
import ListView from '../Common/ListView';
import { LanguageContext } from '../../context/LanguageContext';
import { defineMessages, useIntl } from 'react-intl';
import Header from '../Common/Header';
import useSettings from '../../hooks/useSettings';
import { MediaStatus } from '../../../server/constants/media';
import PageTitle from '../Common/PageTitle';
import { useRouter } from 'next/router';
import {
  TmdbStudio,
  TmdbGenre,
} from '../../../server/api/themoviedb/interfaces';

const messages = defineMessages({
  discovermovies: 'Popular Movies',
  genreMovies: '{genre} Movies',
  studioMovies: '{studio} Movies',
});

interface SearchResult {
  page: number;
  totalResults: number;
  totalPages: number;
  results: MovieResult[];
}

const DiscoverMovies: React.FC = () => {
  const router = useRouter();
  const intl = useIntl();
  const settings = useSettings();
  const { locale } = useContext(LanguageContext);

  const { data: genres } = useSWR<TmdbGenre[]>('/api/v1/genres/movie');
  const genre = genres?.find((g) => g.id === Number(router.query.genreId));

  const { data: studio } = useSWR<TmdbStudio>(
    `/api/v1/studio/${router.query.studioId}`
  );

  const { data, error, size, setSize } = useSWRInfinite<SearchResult>(
    (pageIndex: number, previousPageData: SearchResult | null) => {
      if (previousPageData && pageIndex + 1 > previousPageData.totalPages) {
        return null;
      }

      return `/api/v1/discover/movies?page=${pageIndex + 1}&language=${locale}${
        genre ? `&genre=${genre.id}` : ''
      }${studio ? `&studio=${studio.id}` : ''}`;
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
    [] as MovieResult[]
  );

  if (settings.currentSettings.hideAvailable) {
    titles = titles.filter(
      (i) =>
        (i.mediaType === 'movie' || i.mediaType === 'tv') &&
        i.mediaInfo?.status !== MediaStatus.AVAILABLE &&
        i.mediaInfo?.status !== MediaStatus.PARTIALLY_AVAILABLE
    );
  }

  const isEmpty = !isLoadingInitialData && titles?.length === 0;
  const isReachingEnd =
    isEmpty || (data && data[data.length - 1]?.results.length < 20);

  const title = genre
    ? intl.formatMessage(messages.genreMovies, { genre: genre.name })
    : studio
    ? intl.formatMessage(messages.studioMovies, { studio: studio.name })
    : intl.formatMessage(messages.discovermovies);

  return (
    <>
      <PageTitle title={title} />
      <div className="mt-1 mb-5">
        <Header>{title}</Header>
      </div>
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

export default DiscoverMovies;
