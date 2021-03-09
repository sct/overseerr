import React, { useContext } from 'react';
import useSWR from 'swr';
import type { TvResult } from '../../../server/models/Search';
import ListView from '../Common/ListView';
import { useRouter } from 'next/router';
import { LanguageContext } from '../../context/LanguageContext';
import Header from '../Common/Header';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { TvDetails } from '../../../server/models/Tv';
import PageTitle from '../Common/PageTitle';
import Error from '../../pages/_error';
import useDiscover from '../../hooks/useDiscover';

const messages = defineMessages({
  recommendations: 'Recommendations',
  recommendationssubtext: 'If you liked {title}, you might also like…',
});

const TvRecommendations: React.FC = () => {
  const router = useRouter();
  const intl = useIntl();
  const { locale } = useContext(LanguageContext);
  const { data: tvData, error: tvError } = useSWR<TvDetails>(
    `/api/v1/tv/${router.query.tvId}?language=${locale}`
  );
  const {
    isLoadingInitialData,
    isEmpty,
    isLoadingMore,
    isReachingEnd,
    titles,
    fetchMore,
    error,
  } = useDiscover<TvResult>(`/api/v1/tv/${router.query.tvId}/recommendations`);

  if (error) {
    return <Error statusCode={500} />;
  }

  return (
    <>
      <PageTitle
        title={[intl.formatMessage(messages.recommendations), tvData?.name]}
      />
      <div className="mt-1 mb-5">
        <Header
          subtext={
            tvData && !tvError
              ? intl.formatMessage(messages.recommendationssubtext, {
                  title: tvData.name,
                })
              : ''
          }
        >
          <FormattedMessage {...messages.recommendations} />
        </Header>
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

export default TvRecommendations;
