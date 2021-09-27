import { ArrowCircleRightIcon } from '@heroicons/react/outline';
import Link from 'next/link';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';
import type { MediaResultsResponse } from '../../../server/interfaces/api/mediaInterfaces';
import type { RequestResultsResponse } from '../../../server/interfaces/api/requestInterfaces';
import PageTitle from '../Common/PageTitle';
import MediaSlider from '../MediaSlider';
import RequestCard from '../RequestCard';
import Slider from '../Slider';
import TmdbTitleCard from '../TitleCard/TmdbTitleCard';
import MovieGenreSlider from './MovieGenreSlider';
import NetworkSlider from './NetworkSlider';
import StudioSlider from './StudioSlider';
import TvGenreSlider from './TvGenreSlider';
import { getPath } from '../../utils/pathBuilder';

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
});

const Discover: React.FC = () => {
  const intl = useIntl();

  const { data: media, error: mediaError } = useSWR<MediaResultsResponse>(
    getPath('/media?filter=allavailable&take=20&sort=mediaAdded'),
    { revalidateOnMount: true }
  );

  const { data: requests, error: requestError } =
    useSWR<RequestResultsResponse>(
      getPath('/request?filter=all&take=10&sort=modified&skip=0'),
      { revalidateOnMount: true }
    );

  return (
    <>
      <PageTitle title={intl.formatMessage(messages.discover)} />
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
            tmdbId={item.tmdbId}
            type={item.mediaType}
          />
        ))}
      />
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
      <MediaSlider
        sliderKey="trending"
        title={intl.formatMessage(messages.trending)}
        url={getPath('/discover/trending')}
        linkUrl="/discover/trending"
      />
      <MediaSlider
        sliderKey="popular-movies"
        title={intl.formatMessage(messages.popularmovies)}
        url={getPath('/discover/movies')}
        linkUrl="/discover/movies"
      />
      <MovieGenreSlider />
      <MediaSlider
        sliderKey="upcoming"
        title={intl.formatMessage(messages.upcoming)}
        url={getPath('/discover/movies/upcoming')}
        linkUrl="/discover/movies/upcoming"
      />
      <StudioSlider />
      <MediaSlider
        sliderKey="popular-tv"
        title={intl.formatMessage(messages.populartv)}
        url={getPath('/discover/tv')}
        linkUrl="/discover/tv"
      />
      <TvGenreSlider />
      <MediaSlider
        sliderKey="upcoming-tv"
        title={intl.formatMessage(messages.upcomingtv)}
        url={getPath('/discover/tv/upcoming')}
        linkUrl="/discover/tv/upcoming"
      />
      <NetworkSlider />
    </>
  );
};

export default Discover;
