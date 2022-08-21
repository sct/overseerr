import Header from '@/components/Common/Header';
import ListView from '@/components/Common/ListView';
import PageTitle from '@/components/Common/PageTitle';
import useDiscover from '@/hooks/useDiscover';
import Error from '@/pages/_error';
import type { TvResult } from '@server/models/Search';
import type { TvDetails } from '@server/models/Tv';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages({
  similar: 'Similar Series',
});

const TvSimilar = () => {
  const router = useRouter();
  const intl = useIntl();
  const { data: tvData } = useSWR<TvDetails>(`/api/v1/tv/${router.query.tvId}`);
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
            <Link href={`/tv/${tvData?.id}`}>
              <a className="hover:underline">{tvData?.name}</a>
            </Link>
          }
        >
          {intl.formatMessage(messages.similar)}
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
