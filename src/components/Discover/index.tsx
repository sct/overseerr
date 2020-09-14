import React, { useRef } from 'react';
import { useSWRInfinite } from 'swr';
import type { MovieResult } from '../../../server/models/Search';
import TitleCard from '../TitleCard';
import useVerticalScroll from '../../hooks/useVerticalScroll';

interface SearchResult {
  page: number;
  totalResults: number;
  totalPages: number;
  results: MovieResult[];
}

const getKey = (pageIndex: number, previousPageData: SearchResult | null) => {
  if (previousPageData && pageIndex + 1 > previousPageData.totalPages) {
    return null;
  }

  return `/api/v1/discover/movies?page=${pageIndex + 1}`;
};

const Discover: React.FC = () => {
  const { data, error, size, setSize } = useSWRInfinite<SearchResult>(getKey, {
    initialSize: 3,
  });

  const isLoadingInitialData = !data && !error;
  const isLoadingMore =
    isLoadingInitialData ||
    (size > 0 && data && typeof data[size - 1] === 'undefined');

  useVerticalScroll(() => {
    setSize(size + 1);
  }, !isLoadingMore && !isLoadingInitialData);

  if (error) {
    return <div>{error}</div>;
  }

  const titles = data?.reduce(
    (a, v) => [...a, ...v.results],
    [] as MovieResult[]
  );

  return (
    <>
      <div className="md:flex md:items-center md:justify-between mb-8 mt-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-white sm:text-3xl sm:leading-9 sm:truncate">
            Discover
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <span className="relative z-0 inline-flex shadow-sm rounded-md">
            <button
              type="button"
              className="relative inline-flex items-center px-4 py-2 rounded-l-md border border-indigo-900 bg-indigo-500 hover:bg-indigo-400 text-sm leading-5 font-medium text-cool-gray-100 hover:text-white focus:z-10 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:bg-gray-100 active:text-gray-700 transition ease-in-out duration-150"
            >
              Movies
            </button>
            <button
              type="button"
              className="-ml-px relative inline-flex items-center px-4 py-2 rounded-r-md border border-indigo-900 bg-indigo-500   text-sm leading-5 font-medium text-cool-gray-100 hover:text-white focus:z-10 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:bg-gray-100 active:text-gray-700 transition ease-in-out duration-150"
            >
              TV Shows
            </button>
          </span>
        </div>
      </div>
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {titles?.map((title) => (
          <li
            key={title.id}
            className="col-span-1 flex flex-col text-center items-center"
          >
            <TitleCard
              image={`image.tmdb.org/t/p/w600_and_h900_bestv2${title.posterPath}`}
              status={title.request?.status}
              summary={title.overview}
              title={title.title}
              userScore={title.voteAverage}
              year={title.releaseDate}
              mediaType={title.mediaType}
            />
          </li>
        ))}
        {(isLoadingInitialData ||
          (isLoadingMore && (titles?.length ?? 0) > 0)) &&
          [...Array(8)].map((_item, i) => (
            <li
              key={`placeholder-${i}`}
              className="col-span-1 flex flex-col text-center items-center"
            >
              <TitleCard.Placeholder />
            </li>
          ))}
      </ul>
    </>
  );
};

export default Discover;
