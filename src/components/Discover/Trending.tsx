import { defineMessages, useIntl } from 'react-intl';
import type {
  MovieResult,
  PersonResult,
  TvResult,
} from '../../../server/models/Search';
import useDiscover from '../../hooks/useDiscover';
import Error from '../../pages/_error';
import Header from '../Common/Header';
import ListView from '../Common/ListView';
import PageTitle from '../Common/PageTitle';

const messages = defineMessages({
  trending: 'Trending',
});

const Trending = () => {
  const intl = useIntl();
  const {
    isLoadingInitialData,
    isEmpty,
    isLoadingMore,
    isReachingEnd,
    titles,
    fetchMore,
    error,
  } = useDiscover<MovieResult | TvResult | PersonResult>(
    '/api/v1/discover/trending'
  );

  if (error) {
    return <Error statusCode={500} />;
  }

  return (
    <>
      <PageTitle title={intl.formatMessage(messages.trending)} />
      <div className="mt-1 mb-5">
        <Header>{intl.formatMessage(messages.trending)}</Header>
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

export default Trending;
