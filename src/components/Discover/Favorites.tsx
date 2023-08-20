import Header from '@app/components/Common/Header';
import ListView from '@app/components/Common/ListView';
import PageTitle from '@app/components/Common/PageTitle';
import useDiscover from '@app/hooks/useDiscover';
import Error from '@app/pages/_error';
import type {
  MovieResult,
  PersonResult,
  TvResult,
} from '@server/models/Search';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  favorites: 'Favorites',
});

const Favorites = () => {
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
    '/api/v1/media/favorites'
  );

  if (error) {
    return <Error statusCode={500} />;
  }

  return (
    <>
      <PageTitle title={intl.formatMessage(messages.favorites)} />
      <div className="mt-1 mb-5">
        <Header>{intl.formatMessage(messages.favorites)}</Header>
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

export default Favorites;
