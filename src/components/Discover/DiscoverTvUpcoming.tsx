import React from 'react';
import type { TvResult } from '../../../server/models/Search';
import ListView from '../Common/ListView';
import { defineMessages, useIntl } from 'react-intl';
import Header from '../Common/Header';
import PageTitle from '../Common/PageTitle';
import useDiscover from '../../hooks/useDiscover';
import Error from '../../pages/_error';

const messages = defineMessages({
  upcomingtv: 'Upcoming Series',
});

const DiscoverTvUpcoming = () => {
  const intl = useIntl();

  const {
    isLoadingInitialData,
    isEmpty,
    isLoadingMore,
    isReachingEnd,
    titles,
    fetchMore,
    error,
  } = useDiscover<TvResult>('/api/v1/discover/tv/upcoming');

  if (error) {
    return <Error statusCode={500} />;
  }

  return (
    <>
      <PageTitle title={intl.formatMessage(messages.upcomingtv)} />
      <div className="mt-1 mb-5">
        <Header>{intl.formatMessage(messages.upcomingtv)}</Header>
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

export default DiscoverTvUpcoming;
