import React from 'react';
import useSWR from 'swr';
import type { MovieResult, TvResult } from '../../../server/models/Search';
import TitleCard from '../TitleCard';
import { MediaRequest } from '../../../server/entity/MediaRequest';
import RequestCard from '../TitleCard/RequestCard';
import Slider from '../Slider';

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
  const { data: movieData, error: movieError } = useSWR<MovieDiscoverResult>(
    '/api/v1/discover/movies'
  );
  const { data: tvData, error: tvError } = useSWR<TvDiscoverResult>(
    '/api/v1/discover/tv'
  );

  const { data: requests, error: requestError } = useSWR<MediaRequest[]>(
    '/api/v1/request'
  );

  return (
    <>
      <div className="md:flex md:items-center md:justify-between mb-4 mt-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl leading-7 text-white sm:text-2xl sm:leading-9 sm:truncate">
            Recent Requests
          </h2>
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
          <h2 className="text-xl leading-7 text-white sm:text-2xl sm:leading-9 sm:truncate">
            Popular Movies
          </h2>
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
          <h2 className="text-xl leading-7 text-white sm:text-2xl sm:leading-9 sm:truncate">
            Popular TV Shows
          </h2>
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
