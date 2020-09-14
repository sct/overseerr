import React, { useRef } from 'react';
import useSWR, { useSWRInfinite } from 'swr';
import type { MovieResult, TvResult } from '../../../server/models/Search';
import TitleCard from '../TitleCard';
import useVerticalScroll from '../../hooks/useVerticalScroll';

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

const getKey = (
  pageIndex: number,
  previousPageData: MovieDiscoverResult | null
) => {
  if (previousPageData && pageIndex + 1 > previousPageData.totalPages) {
    return null;
  }

  return `/api/v1/discover/movies?page=${pageIndex + 1}`;
};

const Discover: React.FC = () => {
  const { data: movieData, error: movieError } = useSWR<MovieDiscoverResult>(
    '/api/v1/discover/movies'
  );
  const { data: tvData, error: tvError } = useSWR<TvDiscoverResult>(
    '/api/v1/discover/tv'
  );

  return (
    <>
      <div className="md:flex md:items-center md:justify-between mb-4 mt-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl leading-7 text-white sm:text-2xl sm:leading-9 sm:truncate">
            Popular Movies
          </h2>
        </div>
      </div>
      <div
        className="overflow-x-scroll whitespace-no-wrap hide-scrollbar scrolling-touch overscroll-x-contain -ml-2 -mr-4"
        style={{ height: 295 }}
      >
        {movieData?.results.map((title) => (
          <div key={title.id} className="px-2 inline-block">
            <TitleCard
              image={title.posterPath}
              status={title.request?.status}
              summary={title.overview}
              title={title.title}
              userScore={title.voteAverage}
              year={title.releaseDate}
              mediaType={title.mediaType}
            />
          </div>
        ))}
        {!movieData &&
          !movieError &&
          [...Array(10)].map((_item, i) => (
            <div key={`placeholder-${i}`} className="px-2 inline-block">
              <TitleCard.Placeholder />
            </div>
          ))}
      </div>
      <div className="md:flex md:items-center md:justify-between mb-4 mt-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl leading-7 text-white sm:text-2xl sm:leading-9 sm:truncate">
            Popular TV Shows
          </h2>
        </div>
      </div>
      <div
        className="overflow-x-scroll whitespace-no-wrap hide-scrollbar scrolling-touch overscroll-x-contain -ml-2 -mr-4"
        style={{ height: 295 }}
      >
        {tvData?.results.map((title) => (
          <div key={title.id} className="px-2 inline-block">
            <TitleCard
              image={title.posterPath}
              status={title.request?.status}
              summary={title.overview}
              title={title.name}
              userScore={title.voteAverage}
              year={title.firstAirDate}
              mediaType={title.mediaType}
            />
          </div>
        ))}
        {!tvData &&
          !tvError &&
          [...Array(10)].map((_item, i) => (
            <div key={`placeholder-${i}`} className="px-2 inline-block">
              <TitleCard.Placeholder />
            </div>
          ))}
      </div>
    </>
  );
};

export default Discover;
