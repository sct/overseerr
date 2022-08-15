import React from 'react';
import ListView from '../../Common/ListView';
import { defineMessages, useIntl } from 'react-intl';
import Header from '../../Common/Header';
import PageTitle from '../../Common/PageTitle';
import useDiscover from '../../../hooks/useDiscover';
import Error from '../../../pages/_error';
import type { WatchlistItem } from '../../../../server/interfaces/api/discoverInterfaces';

const messages = defineMessages({
  discoverwatchlist: 'Plex Watchlist',
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
