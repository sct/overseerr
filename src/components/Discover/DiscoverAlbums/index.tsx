import Header from '@app/components/Common/Header';
import ListView from '@app/components/Common/ListView';
import PageTitle from '@app/components/Common/PageTitle';
import Slider from '@app/components/Slider';
import TitleCard from '@app/components/TitleCard';
import type { BaseSearchResult } from '@app/hooks/useDiscover';
import useDiscover from '@app/hooks/useDiscover';
import Error from '@app/pages/_error';
import type { AlbumResult } from '@server/models/Search';
import { useRouter } from 'next/router';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages({
  discoveralbums: 'Albums',
  trendingalbums: 'Trending Albums',
});

const DiscoverAlbums = () => {
  const intl = useIntl();
  const router = useRouter();

  const { data: trendingAlbums } = useSWR<BaseSearchResult<AlbumResult>>(
    '/api/v1/discover/albums/popular'
  );

  const {
    isLoadingInitialData,
    isEmpty,
    isLoadingMore,
    isReachingEnd,
    titles,
    fetchMore,
    error,
  } = useDiscover<AlbumResult>(
    '/api/v1/discover/albums',
    {
      query: (router.query.query as string) || '*',
    },
    { hideAvailable: false }
  );

  if (error) {
    return <Error statusCode={500} />;
  }

  const title = intl.formatMessage(messages.discoveralbums);

  return (
    <>
      <PageTitle title={title} />
      <div className="mb-4">
        <Header>{title}</Header>
      </div>
      <div className="mb-6">
        <div className="slider-header">
          <div className="slider-title">
            <span>{intl.formatMessage(messages.trendingalbums)}</span>
          </div>
        </div>
        <Slider
          sliderKey="trending-albums"
          isLoading={!trendingAlbums}
          isEmpty={(trendingAlbums?.results?.length ?? 0) === 0}
          items={(trendingAlbums?.results ?? []).slice(0, 10).map((album) => {
            const artistName =
              album.artistCredit?.[0]?.name ||
              album.artistCredit?.[0]?.artist?.name ||
              '';
            return (
              <TitleCard
                key={`trending-album-${album.id}`}
                id={album.id}
                image={undefined}
                status={album.mediaInfo?.status}
                summary={artistName ? `by ${artistName}` : undefined}
                title={album.title}
                userScore={undefined}
                year={album.firstReleaseDate}
                mediaType="album"
                canExpand
                mbid={album.id}
              />
            );
          })}
        />
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

export default DiscoverAlbums;
