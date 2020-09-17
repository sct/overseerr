import React, { useContext } from 'react';
import useSWR from 'swr';
import type { MovieResult, TvResult } from '../../../server/models/Search';
import TitleCard from '../TitleCard';
import { MediaRequest } from '../../../server/entity/MediaRequest';
import RequestCard from '../TitleCard/RequestCard';
import Slider from '../Slider';
import Link from 'next/link';
import { defineMessages, FormattedMessage } from 'react-intl';
import { LanguageContext } from '../../context/LanguageContext';

const messages = defineMessages({
  recentrequests: 'Recent Requests',
  popularmovies: 'Popular Movies',
  populartv: 'Popular Series',
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

const Discover: React.FC = () => {
  const { locale } = useContext(LanguageContext);
  const { data: movieData, error: movieError } = useSWR<MovieDiscoverResult>(
    `/api/v1/discover/movies?language=${locale}`
  );
  const { data: tvData, error: tvError } = useSWR<TvDiscoverResult>(
    `/api/v1/discover/tv?language=${locale}`
  );

  const { data: requests, error: requestError } = useSWR<MediaRequest[]>(
    '/api/v1/request'
  );

  return (
    <>
      <div className="md:flex md:items-center md:justify-between mb-4 mt-6">
        <div className="flex-1 min-w-0">
          <Link href="/requests">
            <a className="inline-flex text-xl leading-7 text-cool-gray-300 hover:text-white sm:text-2xl sm:leading-9 sm:truncate items-center">
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
        isEmpty={!!requests && !requestError && requests.length === 0}
        items={requests?.map((request) => (
          <RequestCard
            key={`request-slider-item-${request.id}`}
            tmdbId={request.mediaId}
            type={request.mediaType}
          />
        ))}
      />
      <div className="md:flex md:items-center md:justify-between mb-4 mt-6">
        <div className="flex-1 min-w-0">
          <Link href="/discover/movies">
            <a className="inline-flex text-xl leading-7 text-cool-gray-300 hover:text-white sm:text-2xl sm:leading-9 sm:truncate items-center">
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
            status={title.request?.status}
            summary={title.overview}
            title={title.title}
            userScore={title.voteAverage}
            year={title.releaseDate}
            mediaType={title.mediaType}
            requestId={title.request?.id}
          />
        ))}
      />
      <div className="md:flex md:items-center md:justify-between mb-4 mt-4">
        <div className="flex-1 min-w-0">
          <Link href="/discover/tv">
            <a className="inline-flex text-xl leading-7 text-cool-gray-300 hover:text-white sm:text-2xl sm:leading-9 sm:truncate items-center">
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
            status={title.request?.status}
            summary={title.overview}
            title={title.name}
            userScore={title.voteAverage}
            year={title.firstAirDate}
            mediaType={title.mediaType}
            requestId={title.request?.id}
          />
        ))}
      />
    </>
  );
};

export default Discover;
