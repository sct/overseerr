import React, { useContext } from 'react';
import useSWR from 'swr';
import type { TvResult } from '../../../server/models/Search';
import ListView from '../Common/ListView';
import { useRouter } from 'next/router';
import { LanguageContext } from '../../context/LanguageContext';
import { useIntl, defineMessages, FormattedMessage } from 'react-intl';
import type { TvDetails } from '../../../server/models/Tv';
import Header from '../Common/Header';
import PageTitle from '../Common/PageTitle';
import useDiscover from '../../hooks/useDiscover';
import Error from '../../pages/_error';

const messages = defineMessages({
  similar: 'Similar Series',
  similarsubtext: 'Other series similar to {title}',
});

const TvSimilar: React.FC = () => {
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
  } = useDiscover<TvResult>(`/api/v1/tv/${router.query.tvId}/similar`);

  if (error) {
    return <Error statusCode={500} />;
  }

  return (
    <>
      <PageTitle title={[intl.formatMessage(messages.similar), tvData?.name]} />
      <div className="mt-1 mb-5">
        <Header
          subtext={
            tvData && !tvError
              ? intl.formatMessage(messages.similarsubtext, {
                  title: tvData.name,
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
        isReachingEnd={isReachingEnd}
        isLoading={
          isLoadingInitialData || (isLoadingMore && (titles?.length ?? 0) > 0)
        }
        onScrollBottom={fetchMore}
      />
    </>
  );
};

export default TvSimilar;
