import PageTitle from '@app/components/Common/PageTitle';
import MovieGenreSlider from '@app/components/Discover/MovieGenreSlider';
import NetworkSlider from '@app/components/Discover/NetworkSlider';
import StudioSlider from '@app/components/Discover/StudioSlider';
import TvGenreSlider from '@app/components/Discover/TvGenreSlider';
import MediaSlider from '@app/components/MediaSlider';
import RequestCard from '@app/components/RequestCard';
import Slider from '@app/components/Slider';
import TmdbTitleCard from '@app/components/TitleCard/TmdbTitleCard';
import { Permission, UserType, useUser } from '@app/hooks/useUser';
import { ArrowCircleRightIcon } from '@heroicons/react/outline';
import type { WatchlistItem } from '@server/interfaces/api/discoverInterfaces';
import type { MediaResultsResponse } from '@server/interfaces/api/mediaInterfaces';
import type { RequestResultsResponse } from '@server/interfaces/api/requestInterfaces';
import Link from 'next/link';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages({
  discover: 'Discover',
  recentrequests: 'Recent Requests',
  popularmovies: 'Popular Movies',
  populartv: 'Popular Series',
  upcomingtv: 'Upcoming Series',
  recentlyAdded: 'Recently Added',
  noRequests: 'No requests.',
  upcoming: 'Upcoming Movies',
  trending: 'Trending',
  plexwatchlist: 'Your Plex Watchlist',
});

const Discover = () => {
  const intl = useIntl();
  const { user, hasPermission } = useUser();

  const { data: media, error: mediaError } = useSWR<MediaResultsResponse>(
    '/api/v1/media?filter=allavailable&take=20&sort=mediaAdded',
    { revalidateOnMount: true }
  );

  const { data: requests, error: requestError } =
    useSWR<RequestResultsResponse>(
      '/api/v1/request?filter=all&take=10&sort=modified&skip=0',
      {
        revalidateOnMount: true,
      }
    );

  const { data: watchlistItems, error: watchlistError } = useSWR<{
    page: number;
    totalPages: number;
    totalResults: number;
    results: WatchlistItem[];
  }>(user?.userType === UserType.PLEX ? '/api/v1/discover/watchlist' : null, {
    revalidateOnMount: true,
  });

  return (
    <>
      <PageTitle title={intl.formatMessage(messages.discover)} />
      {hasPermission([Permission.MANAGE_REQUESTS, Permission.RECENT_VIEW], {
        type: 'or',
      }) && (
        <>
          <div className="slider-header">
            <div className="slider-title">
              <span>{intl.formatMessage(messages.recentlyAdded)}</span>
            </div>
          </div>
          <Slider
            sliderKey="media"
            isLoading={!media && !mediaError}
            isEmpty={!!media && !mediaError && media.results.length === 0}
            items={media?.results?.map((item) => (
              <TmdbTitleCard
                key={`media-slider-item-${item.id}`}
                id={item.id}
                tmdbId={item.tmdbId}
                tvdbId={item.tvdbId}
                type={item.mediaType}
              />
            ))}
          />
        </>
      )}
      <div className="slider-header">
        <Link href="/requests?filter=all">
          <a className="slider-title">
            <span>{intl.formatMessage(messages.recentrequests)}</span>
            <ArrowCircleRightIcon />
          </a>
        </Link>
      </div>
      <Slider
        sliderKey="requests"
        isLoading={!requests && !requestError}
        isEmpty={!!requests && !requestError && requests.results.length === 0}
        items={(requests?.results ?? []).map((request) => (
          <RequestCard
            key={`request-slider-item-${request.id}`}
            request={request}
          />
        ))}
        placeholder={<RequestCard.Placeholder />}
        emptyMessage={intl.formatMessage(messages.noRequests)}
      />
      {(!watchlistItems || !!watchlistItems.results.length) && !watchlistError && (
        <>
          <div className="slider-header">
            <Link href="/discover/watchlist">
              <a className="slider-title">
                <span>{intl.formatMessage(messages.plexwatchlist)}</span>
                <ArrowCircleRightIcon />
              </a>
            </Link>
          </div>
          <Slider
            sliderKey="watchlist"
            isLoading={!watchlistItems && !watchlistError}
            items={watchlistItems?.results.map((item) => (
              <TmdbTitleCard
                id={item.tmdbId}
                key={`watchlist-slider-item-${item.ratingKey}`}
                tmdbId={item.tmdbId}
                type={item.mediaType}
              />
            ))}
          />
        </>
      )}
      <MediaSlider
        sliderKey="trending"
        title={intl.formatMessage(messages.trending)}
        url="/api/v1/discover/trending"
        linkUrl="/discover/trending"
      />
      <MediaSlider
        sliderKey="popular-movies"
        title={intl.formatMessage(messages.popularmovies)}
        url="/api/v1/discover/movies"
        linkUrl="/discover/movies"
      />
      <MovieGenreSlider />
      <MediaSlider
        sliderKey="upcoming"
        title={intl.formatMessage(messages.upcoming)}
        linkUrl="/discover/movies/upcoming"
        url="/api/v1/discover/movies/upcoming"
      />
      <StudioSlider />
      <MediaSlider
        sliderKey="popular-tv"
        title={intl.formatMessage(messages.populartv)}
        url="/api/v1/discover/tv"
        linkUrl="/discover/tv"
      />
      <TvGenreSlider />
      <MediaSlider
        sliderKey="upcoming-tv"
        title={intl.formatMessage(messages.upcomingtv)}
        url="/api/v1/discover/tv/upcoming"
        linkUrl="/discover/tv/upcoming"
      />
      <NetworkSlider />
    </>
  );
};

export default Discover;
