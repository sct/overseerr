import Header from '@app/components/Common/Header';
import ListView from '@app/components/Common/ListView';
import PageTitle from '@app/components/Common/PageTitle';
import Slider from '@app/components/Slider';
import TitleCard from '@app/components/TitleCard';
import useDiscover from '@app/hooks/useDiscover';
import Error from '@app/pages/_error';
import type { BaseSearchResult } from '@app/hooks/useDiscover';
import type { ArtistResult, TrackResult } from '@server/models/Search';
import { useRouter } from 'next/router';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages({
  discoverartists: 'Artists',
  trendingartists: 'Trending Artists',
  trendingsongs: 'Trending Songs',
});

const DiscoverArtists = () => {
  const intl = useIntl();
  const router = useRouter();

  const { data: trendingArtists } = useSWR<BaseSearchResult<ArtistResult>>(
    '/api/v1/discover/artists/popular'
  );
  const { data: trendingTracks } = useSWR<BaseSearchResult<TrackResult>>(
    '/api/v1/discover/tracks/popular'
  );

  const {
    isLoadingInitialData,
    isEmpty,
    isLoadingMore,
    isReachingEnd,
    titles,
    fetchMore,
    error,
  } = useDiscover<ArtistResult>(
    '/api/v1/discover/artists',
    {
      query: (router.query.query as string) || '*',
    },
    { hideAvailable: false }
  );

  if (error) {
    return <Error statusCode={500} />;
  }

  const title = intl.formatMessage(messages.discoverartists);

  return (
    <>
      <PageTitle title={title} />
      <div className="mb-4">
        <Header>{title}</Header>
      </div>
      <div className="mb-6">
        <Slider
          sliderKey="trending-artists"
          title={intl.formatMessage(messages.trendingartists)}
          isLoading={!trendingArtists}
          isEmpty={(trendingArtists?.results?.length ?? 0) === 0}
          items={(trendingArtists?.results ?? []).slice(0, 10).map((artist) => (
            <TitleCard
              key={`trending-artist-${artist.id}`}
              id={artist.id}
              image={undefined}
              status={artist.mediaInfo?.status}
              summary={undefined}
              title={artist.name}
              userScore={undefined}
              year={undefined}
              mediaType="artist"
              canExpand
              mbid={artist.id}
            />
          ))}
        />
      </div>
      <div className="mb-6">
        <Slider
          sliderKey="trending-tracks"
          title={intl.formatMessage(messages.trendingsongs)}
          isLoading={!trendingTracks}
          isEmpty={(trendingTracks?.results?.length ?? 0) === 0}
          items={(trendingTracks?.results ?? []).slice(0, 10).map((track) => {
            const artistName =
              track.artistCredit?.[0]?.name ||
              track.artistCredit?.[0]?.artist?.name ||
              '';
            return (
              <TitleCard
                key={`trending-track-${track.id}`}
                id={track.id}
                image={undefined}
                status={track.mediaInfo?.status}
                summary={artistName ? `by ${artistName}` : undefined}
                title={track.title}
                userScore={undefined}
                year={track.firstReleaseDate}
                mediaType="track"
                canExpand
                mbid={track.id}
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

export default DiscoverArtists;
