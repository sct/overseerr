import React, { useContext } from 'react';
import useSWR from 'swr';
import type { MovieResult } from '../../../server/models/Search';
import ListView from '../Common/ListView';
import { useRouter } from 'next/router';
import Header from '../Common/Header';
import { LanguageContext } from '../../context/LanguageContext';
import type { MovieDetails } from '../../../server/models/Movie';
import { defineMessages, useIntl, FormattedMessage } from 'react-intl';
import PageTitle from '../Common/PageTitle';
import useDiscover from '../../hooks/useDiscover';
import Error from '../../pages/_error';

const messages = defineMessages({
  similar: 'Similar Titles',
  similarsubtext: 'Other movies similar to {title}',
});

const MovieSimilar: React.FC = () => {
  const router = useRouter();
  const intl = useIntl();
  const { locale } = useContext(LanguageContext);
  const { data: movieData, error: movieError } = useSWR<MovieDetails>(
    `/api/v1/movie/${router.query.movieId}?language=${locale}`
  );
  const {
    isLoadingInitialData,
    isEmpty,
    isLoadingMore,
    isReachingEnd,
    titles,
    fetchMore,
    error,
  } = useDiscover<MovieResult>(`/api/v1/movie/${router.query.movieId}/similar`);

  if (error) {
    return <Error statusCode={500} />;
  }

  return (
    <>
      <PageTitle
        title={[intl.formatMessage(messages.similar), movieData?.title]}
      />
      <div className="mt-1 mb-5">
        <Header
          subtext={
            movieData && !movieError
              ? intl.formatMessage(messages.similarsubtext, {
                  title: movieData.title,
                })
              : undefined
          }
        >
          <FormattedMessage {...messages.similar} />
        </Header>
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

export default MovieSimilar;
