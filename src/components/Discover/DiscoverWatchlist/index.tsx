import Header from '@/components/Common/Header';
import ListView from '@/components/Common/ListView';
import PageTitle from '@/components/Common/PageTitle';
import useDiscover from '@/hooks/useDiscover';
import Error from '@/pages/_error';
import type { WatchlistItem } from '@server/interfaces/api/discoverInterfaces';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  discoverwatchlist: 'Your Plex Watchlist',
});

const DiscoverWatchlist = () => {
  const intl = useIntl();

  const {
    isLoadingInitialData,
    isEmpty,
    isLoadingMore,
    isReachingEnd,
    titles,
    fetchMore,
    error,
  } = useDiscover<WatchlistItem>('/api/v1/discover/watchlist');

  if (error) {
    return <Error statusCode={500} />;
  }

  const title = intl.formatMessage(messages.discoverwatchlist);

  return (
    <>
      <PageTitle title={title} />
      <div className="mt-1 mb-5">
        <Header>{title}</Header>
      </div>
      <ListView
        plexItems={titles}
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

export default DiscoverWatchlist;
