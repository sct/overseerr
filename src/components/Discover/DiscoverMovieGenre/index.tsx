import React from 'react';
import type { MovieResult } from '../../../../server/models/Search';
import ListView from '../../Common/ListView';
import { defineMessages, useIntl } from 'react-intl';
import Header from '../../Common/Header';
import PageTitle from '../../Common/PageTitle';
import { useRouter } from 'next/router';
import globalMessages from '../../../i18n/globalMessages';
import useDiscover from '../../../hooks/useDiscover';
import Error from '../../../pages/_error';

const messages = defineMessages({
  genreMovies: '{genre} Movies',
});

const DiscoverMovieGenre: React.FC = () => {
  const router = useRouter();
  const intl = useIntl();

  const {
    isLoadingInitialData,
    isEmpty,
    isLoadingMore,
    isReachingEnd,
    titles,
    fetchMore,
    error,
    firstResultData,
  } = useDiscover<MovieResult, { genre: { id: number; name: string } }>(
    `/api/v1/discover/movies/genre/${router.query.genreId}`
  );

  if (error) {
    return <Error statusCode={500} />;
  }

  const title = isLoadingInitialData
    ? intl.formatMessage(globalMessages.loading)
    : intl.formatMessage(messages.genreMovies, {
        genre: firstResultData?.genre.name,
      });

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

export default DiscoverMovieGenre;
