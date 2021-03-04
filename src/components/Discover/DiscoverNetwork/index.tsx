import React from 'react';
import type { TvResult } from '../../../../server/models/Search';
import ListView from '../../Common/ListView';
import { defineMessages, useIntl } from 'react-intl';
import Header from '../../Common/Header';
import PageTitle from '../../Common/PageTitle';
import { useRouter } from 'next/router';
import globalMessages from '../../../i18n/globalMessages';
import useDiscover from '../../../hooks/useDiscover';
import Error from '../../../pages/_error';
import { TvNetwork } from '../../../../server/models/common';

const messages = defineMessages({
  networkSeries: '{network} Series',
});

const DiscoverTvNetwork: React.FC = () => {
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
  } = useDiscover<TvResult, { network: TvNetwork }>(
    `/api/v1/discover/tv/network/${router.query.networkId}`
  );

  if (error) {
    return <Error statusCode={500} />;
  }

  const title = isLoadingInitialData
    ? intl.formatMessage(globalMessages.loading)
    : intl.formatMessage(messages.networkSeries, {
        network: firstResultData?.network.name,
      });

  return (
    <>
      <PageTitle title={title} />
      <div className="mt-1 mb-5">
        <Header>
          {firstResultData?.network.logoPath ? (
            <div className="flex justify-center mb-6">
              <img
                src={`//image.tmdb.org/t/p/w780_filter(negate,000,666)/${firstResultData?.network.logoPath}`}
                alt=""
                className="text-white max-h-24 sm:max-h-32"
              />
            </div>
          ) : (
            title
          )}
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

export default DiscoverTvNetwork;
