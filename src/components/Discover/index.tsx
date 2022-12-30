import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import { sliderTitles } from '@app/components/Discover/constants';
import MovieGenreSlider from '@app/components/Discover/MovieGenreSlider';
import NetworkSlider from '@app/components/Discover/NetworkSlider';
import PlexWatchlistSlider from '@app/components/Discover/PlexWatchlistSlider';
import RecentlyAddedSlider from '@app/components/Discover/RecentlyAddedSlider';
import RecentRequestsSlider from '@app/components/Discover/RecentRequestsSlider';
import StudioSlider from '@app/components/Discover/StudioSlider';
import TvGenreSlider from '@app/components/Discover/TvGenreSlider';
import MediaSlider from '@app/components/MediaSlider';
import { encodeURIExtraParams } from '@app/hooks/useSearchInput';
import { DiscoverSliderType } from '@server/constants/discover';
import type DiscoverSlider from '@server/entity/DiscoverSlider';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages({
  discover: 'Discover',
  emptywatchlist:
    'Media added to your <PlexWatchlistSupportLink>Plex Watchlist</PlexWatchlistSupportLink> will appear here.',
});

const Discover = () => {
  const intl = useIntl();
  const { data: discoverData, error: discoverError } = useSWR<DiscoverSlider[]>(
    '/api/v1/settings/discover'
  );

  if (!discoverData && !discoverError) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <PageTitle title={intl.formatMessage(messages.discover)} />
      {discoverData?.map((slider) => {
        if (!slider.enabled) {
          return null;
        }

        switch (slider.type) {
          case DiscoverSliderType.RECENTLY_ADDED:
            return <RecentlyAddedSlider />;
          case DiscoverSliderType.RECENT_REQUESTS:
            return <RecentRequestsSlider />;
          case DiscoverSliderType.PLEX_WATCHLIST:
            return <PlexWatchlistSlider />;
          case DiscoverSliderType.TRENDING:
            return (
              <MediaSlider
                sliderKey="trending"
                title={intl.formatMessage(sliderTitles.trending)}
                url="/api/v1/discover/trending"
                linkUrl="/discover/trending"
              />
            );
          case DiscoverSliderType.POPULAR_MOVIES:
            return (
              <MediaSlider
                sliderKey="popular-movies"
                title={intl.formatMessage(sliderTitles.popularmovies)}
                url="/api/v1/discover/movies"
                linkUrl="/discover/movies"
              />
            );
          case DiscoverSliderType.MOVIE_GENRES:
            return <MovieGenreSlider />;
          case DiscoverSliderType.UPCOMING_MOVIES:
            return (
              <MediaSlider
                sliderKey="upcoming"
                title={intl.formatMessage(sliderTitles.upcoming)}
                linkUrl="/discover/movies/upcoming"
                url="/api/v1/discover/movies/upcoming"
              />
            );
          case DiscoverSliderType.STUDIOS:
            return <StudioSlider />;
          case DiscoverSliderType.POPULAR_TV:
            return (
              <MediaSlider
                sliderKey="popular-tv"
                title={intl.formatMessage(sliderTitles.populartv)}
                url="/api/v1/discover/tv"
                linkUrl="/discover/tv"
              />
            );
          case DiscoverSliderType.TV_GENRES:
            return <TvGenreSlider />;
          case DiscoverSliderType.UPCOMING_TV:
            return (
              <MediaSlider
                sliderKey="upcoming-tv"
                title={intl.formatMessage(sliderTitles.upcomingtv)}
                url="/api/v1/discover/tv/upcoming"
                linkUrl="/discover/tv/upcoming"
              />
            );
          case DiscoverSliderType.NETWORKS:
            return <NetworkSlider />;
          case DiscoverSliderType.TMDB_MOVIE_KEYWORD:
            return (
              <MediaSlider
                sliderKey={`custom-slider-${slider.id}`}
                title={slider.title ?? ''}
                url="/api/v1/discover/movies"
                extraParams={
                  slider.data
                    ? `keywords=${encodeURIExtraParams(slider.data)}`
                    : ''
                }
                linkUrl={`/discover/movies/keyword?keywords=${slider.data}`}
              />
            );
          case DiscoverSliderType.TMDB_TV_KEYWORD:
            return (
              <MediaSlider
                sliderKey={`custom-slider-${slider.id}`}
                title={slider.title ?? ''}
                url="/api/v1/discover/tv"
                extraParams={
                  slider.data
                    ? `keywords=${encodeURIExtraParams(slider.data)}`
                    : ''
                }
                linkUrl={`/discover/tv/keyword?keywords=${slider.data}`}
              />
            );
          case DiscoverSliderType.TMDB_MOVIE_GENRE:
            return (
              <MediaSlider
                sliderKey={`custom-slider-${slider.id}`}
                title={slider.title ?? ''}
                url={`/api/v1/discover/movies/genre/${slider.data}`}
                linkUrl={`/discover/movies/genre/${slider.data}`}
              />
            );
          case DiscoverSliderType.TMDB_TV_GENRE:
            return (
              <MediaSlider
                sliderKey={`custom-slider-${slider.id}`}
                title={slider.title ?? ''}
                url={`/api/v1/discover/tv/genre/${slider.data}`}
                linkUrl={`/discover/tv/genre/${slider.data}`}
              />
            );
          case DiscoverSliderType.TMDB_STUDIO:
            return (
              <MediaSlider
                sliderKey={`custom-slider-${slider.id}`}
                title={slider.title ?? ''}
                url={`/api/v1/discover/movies/studio/${slider.data}`}
                linkUrl={`/discover/movies/studio/${slider.data}`}
              />
            );
          case DiscoverSliderType.TMDB_NETWORK:
            return (
              <MediaSlider
                sliderKey={`custom-slider-${slider.id}`}
                title={slider.title ?? ''}
                url={`/api/v1/discover/tv/network/${slider.data}`}
                linkUrl={`/discover/tv/network/${slider.data}`}
              />
            );
          case DiscoverSliderType.TMDB_SEARCH:
            return (
              <MediaSlider
                sliderKey={`custom-slider-${slider.id}`}
                title={slider.title ?? ''}
                url="/api/v1/search"
                extraParams={`query=${slider.data}`}
                linkUrl={`/search?query=${slider.data}`}
              />
            );
        }
      })}
    </>
  );
};

export default Discover;
