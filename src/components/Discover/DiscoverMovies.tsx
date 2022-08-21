import { defineMessages, useIntl } from 'react-intl';
import type { MovieResult } from '../../../server/models/Search';
import useDiscover from '../../hooks/useDiscover';
import Error from '../../pages/_error';
import Header from '../Common/Header';
import ListView from '../Common/ListView';
import PageTitle from '../Common/PageTitle';

const messages = defineMessages({
  discovermovies: 'Popular Movies',
});

const DiscoverMovies = () => {
  const intl = useIntl();

  const {
    isLoadingInitialData,
    isEmpty,
    isLoadingMore,
    isReachingEnd,
    titles,
    fetchMore,
    error,
  } = useDiscover<MovieResult>('/api/v1/discover/movies');

  if (error) {
    return <Error statusCode={500} />;
  }

  const title = intl.formatMessage(messages.discovermovies);

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
