import React from 'react';
import { useRouter } from 'next/router';
import {
  TvResult,
  MovieResult,
  PersonResult,
} from '../../../server/models/Search';
import { useSWRInfinite } from 'swr';
import useVerticalScroll from '../../hooks/useVerticalScroll';
import TitleCard from '../TitleCard';

interface SearchResult {
  page: number;
  totalResults: number;
  totalPages: number;
  results: (MovieResult | TvResult | PersonResult)[];
}

const Search: React.FC = () => {
  const router = useRouter();
  const { data, error, size, setSize } = useSWRInfinite<SearchResult>(
    (pageIndex: number, previousPageData: SearchResult | null) => {
      if (previousPageData && pageIndex + 1 > previousPageData.totalPages) {
        return null;
      }

      return `/api/v1/search/?query=${router.query.query}&page=${
        pageIndex + 1
      }`;
    },
    {
      initialSize: 3,
    }
  );

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
    [] as (MovieResult | TvResult | PersonResult)[]
  );

  return (
    <>
      <div className="md:flex md:items-center md:justify-between mb-8 mt-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl leading-7 text-white sm:text-2xl sm:leading-9 sm:truncate">
            Search Results
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
      {!isLoadingInitialData && titles?.length === 0 && (
        <div className="w-full mt-64 text-2xl text-center text-cool-gray-400">
          No Results
        </div>
      )}
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {titles?.map((title) => {
          let titleCard: React.ReactNode;

          switch (title.mediaType) {
            case 'movie':
              titleCard = (
                <TitleCard
                  image={title.posterPath}
                  status={title.request?.status}
                  summary={title.overview}
                  title={title.title}
                  userScore={title.voteAverage}
                  year={title.releaseDate}
                  mediaType={title.mediaType}
                />
              );
              break;
            case 'tv':
              titleCard = (
                <TitleCard
                  image={title.posterPath}
                  status={title.request?.status}
                  summary={title.overview}
                  title={title.name}
                  userScore={title.voteAverage}
                  year={title.firstAirDate}
                  mediaType={title.mediaType}
                />
              );
              break;
            case 'person':
              titleCard = <div>{title.name}</div>;
              break;
          }

          return (
            <li
              key={title.id}
              className="col-span-1 flex flex-col text-center items-center"
            >
              {titleCard}
            </li>
          );
        })}
        {(isLoadingInitialData ||
          (isLoadingMore && (titles?.length ?? 0) > 0)) &&
          [...Array(10)].map((_item, i) => (
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

export default Search;
