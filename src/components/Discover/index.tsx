import React, { useContext } from 'react';
import useSWR from 'swr';
import type {
  MovieResult,
  TvResult,
  PersonResult,
} from '../../../server/models/Search';
import TitleCard from '../TitleCard';
import PersonCard from '../PersonCard';
import { MediaRequest } from '../../../server/entity/MediaRequest';
import TmdbTitleCard from '../TitleCard/TmdbTitleCard';
import Slider from '../Slider';
import Link from 'next/link';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { LanguageContext } from '../../context/LanguageContext';
import type Media from '../../../server/entity/Media';
import type { MediaResultsResponse } from '../../../server/interfaces/api/mediaInterfaces';
import type { RequestResultsResponse } from '../../../server/interfaces/api/requestInterfaces';
import RequestCard from '../RequestCard';

const messages = defineMessages({
  recentrequests: 'Recent Requests',
  popularmovies: 'Popular Movies',
  populartv: 'Popular Series',
  recentlyAdded: 'Recently Added',
  nopending: 'No Pending Requests',
  upcoming: 'Upcoming Movies',
  trending: 'Trending',
});

interface MovieDiscoverResult {
  page: number;
  totalResults: number;
  totalPages: number;
  results: MovieResult[];
}

interface TvDiscoverResult {
  page: number;
  totalResults: number;
  totalPages: number;
  results: TvResult[];
}

interface MixedResult {
  page: number;
  totalResults: number;
  totalPages: number;
  results: (TvResult | MovieResult | PersonResult)[];
}

const Discover: React.FC = () => {
  const intl = useIntl();
  const { locale } = useContext(LanguageContext);
  const { data: movieData, error: movieError } = useSWR<MovieDiscoverResult>(
    `/api/v1/discover/movies?language=${locale}`
  );
  const { data: tvData, error: tvError } = useSWR<TvDiscoverResult>(
    `/api/v1/discover/tv?language=${locale}`
  );

  const { data: movieUpcomingData, error: movieUpcomingError } = useSWR<
    MovieDiscoverResult
  >(`/api/v1/discover/movies/upcoming?language=${locale}`);

  const { data: trendingData, error: trendingError } = useSWR<MixedResult>(
    `/api/v1/discover/trending?language=${locale}`
  );

  const { data: media, error: mediaError } = useSWR<MediaResultsResponse>(
    '/api/v1/media?filter=available&take=20&sort=modified'
  );

  const { data: requests, error: requestError } = useSWR<
    RequestResultsResponse
  >('/api/v1/request?filter=unavailable&take=20&sort=modified&skip=0');

  return (
    <>
      <div className="md:flex md:items-center md:justify-between mb-4 mt-6">
        <div className="flex-1 min-w-0">
          <div className="inline-flex text-xl leading-7 text-gray-300 hover:text-white sm:text-2xl sm:leading-9 sm:truncate items-center">
            <span>
              <FormattedMessage {...messages.recentlyAdded} />
            </span>
          </div>
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
      <div className="md:flex md:items-center md:justify-between mb-4 mt-6">
        <div className="flex-1 min-w-0">
          <Link href="/requests">
            <a className="inline-flex text-xl leading-7 text-gray-300 hover:text-white sm:text-2xl sm:leading-9 sm:truncate items-center">
              <span>
                <FormattedMessage {...messages.recentrequests} />
              </span>
              <svg
                className="w-6 h-6 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </a>
          </Link>
        </div>
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
        emptyMessage={intl.formatMessage(messages.nopending)}
      />
      <div className="md:flex md:items-center md:justify-between mb-4 mt-6">
        <div className="flex-1 min-w-0">
          <Link href="/discover/movies/upcoming">
            <a className="inline-flex text-xl leading-7 text-gray-300 hover:text-white sm:text-2xl sm:leading-9 sm:truncate items-center">
              <span>
                <FormattedMessage {...messages.upcoming} />
              </span>
              <svg
                className="w-6 h-6 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </a>
          </Link>
        </div>
      </div>
      <Slider
        sliderKey="upcoming"
        isLoading={!movieUpcomingData && !movieUpcomingError}
        isEmpty={false}
        items={movieUpcomingData?.results.map((title) => (
          <TitleCard
            key={`upcoming-movie-slider-${title.id}`}
            id={title.id}
            image={title.posterPath}
            status={title.mediaInfo?.status}
            summary={title.overview}
            title={title.title}
            userScore={title.voteAverage}
            year={title.releaseDate}
            mediaType={title.mediaType}
          />
        ))}
      />
      <div className="md:flex md:items-center md:justify-between mb-4 mt-6">
        <div className="flex-1 min-w-0">
          <Link href="/discover/trending">
            <a className="inline-flex text-xl leading-7 text-gray-300 hover:text-white sm:text-2xl sm:leading-9 sm:truncate items-center">
              <span>
                <FormattedMessage {...messages.trending} />
              </span>
              <svg
                className="w-6 h-6 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </a>
          </Link>
        </div>
      </div>
      <Slider
        sliderKey="trending"
        isLoading={!trendingData && !trendingError}
        isEmpty={false}
        items={trendingData?.results.map((title) => {
          switch (title.mediaType) {
            case 'movie':
              return (
                <TitleCard
                  id={title.id}
                  image={title.posterPath}
                  status={title.mediaInfo?.status}
                  summary={title.overview}
                  title={title.title}
                  userScore={title.voteAverage}
                  year={title.releaseDate}
                  mediaType={title.mediaType}
                />
              );
            case 'tv':
              return (
                <TitleCard
                  id={title.id}
                  image={title.posterPath}
                  status={title.mediaInfo?.status}
                  summary={title.overview}
                  title={title.name}
                  userScore={title.voteAverage}
                  year={title.firstAirDate}
                  mediaType={title.mediaType}
                />
              );
            case 'person':
              return (
                <PersonCard name={title.name} profilePath={title.profilePath} />
              );
          }
        })}
      />
      <div className="md:flex md:items-center md:justify-between mb-4 mt-6">
        <div className="flex-1 min-w-0">
          <Link href="/discover/movies">
            <a className="inline-flex text-xl leading-7 text-gray-300 hover:text-white sm:text-2xl sm:leading-9 sm:truncate items-center">
              <span>
                <FormattedMessage {...messages.popularmovies} />
              </span>
              <svg
                className="w-6 h-6 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </a>
          </Link>
        </div>
      </div>
      <Slider
        sliderKey="movies"
        isLoading={!movieData && !movieError}
        isEmpty={false}
        items={movieData?.results.map((title) => (
          <TitleCard
            key={`popular-movie-slider-${title.id}`}
            id={title.id}
            image={title.posterPath}
            status={title.mediaInfo?.status}
            summary={title.overview}
            title={title.title}
            userScore={title.voteAverage}
            year={title.releaseDate}
            mediaType={title.mediaType}
          />
        ))}
      />
      <div className="md:flex md:items-center md:justify-between mb-4 mt-4">
        <div className="flex-1 min-w-0">
          <Link href="/discover/tv">
            <a className="inline-flex text-xl leading-7 text-gray-300 hover:text-white sm:text-2xl sm:leading-9 sm:truncate items-center">
              <span>
                <FormattedMessage {...messages.populartv} />
              </span>
              <svg
                className="w-6 h-6 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </a>
          </Link>
        </div>
      </div>
      <Slider
        sliderKey="tv"
        isLoading={!tvData && !tvError}
        isEmpty={false}
        items={tvData?.results.map((title) => (
          <TitleCard
            key={`popular-tv-slider-${title.id}`}
            id={title.id}
            image={title.posterPath}
            status={title.mediaInfo?.status}
            summary={title.overview}
            title={title.name}
            userScore={title.voteAverage}
            year={title.firstAirDate}
            mediaType={title.mediaType}
          />
        ))}
      />
    </>
  );
};

export default Discover;
