import React from 'react';
import {
  TvResult,
  MovieResult,
  PersonResult,
} from '../../../../server/models/Search';
import TitleCard from '../../TitleCard';
import useVerticalScroll from '../../../hooks/useVerticalScroll';
import PersonCard from '../../PersonCard';

interface ListViewProps {
  items?: (TvResult | MovieResult | PersonResult)[];
  isEmpty?: boolean;
  isLoading?: boolean;
  isReachingEnd?: boolean;
  onScrollBottom: () => void;
}

const ListView: React.FC<ListViewProps> = ({
  items,
  isEmpty,
  isLoading,
  onScrollBottom,
  isReachingEnd,
}) => {
  useVerticalScroll(onScrollBottom, !isLoading && !isEmpty && !isReachingEnd);
  return (
    <>
      {isEmpty && (
        <div className="w-full mt-64 text-2xl text-center text-gray-400">
          No Results
        </div>
      )}
      <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
        {items?.map((title) => {
          let titleCard: React.ReactNode;

          switch (title.mediaType) {
            case 'movie':
              titleCard = (
                <TitleCard
                  id={title.id}
                  image={title.posterPath}
                  status={title.mediaInfo?.status}
                  summary={title.overview}
                  title={title.title}
                  userScore={title.voteAverage}
                  year={title.releaseDate}
                  mediaType={title.mediaType}
                  canExpand
                />
              );
              break;
            case 'tv':
              titleCard = (
                <TitleCard
                  id={title.id}
                  image={title.posterPath}
                  status={title.mediaInfo?.status}
                  summary={title.overview}
                  title={title.name}
                  userScore={title.voteAverage}
                  year={title.firstAirDate}
                  mediaType={title.mediaType}
                  canExpand
                />
              );
              break;
            case 'person':
              titleCard = (
                <PersonCard
                  name={title.name}
                  profilePath={title.profilePath}
                  canExpand
                />
              );
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
        {isLoading &&
          !isReachingEnd &&
          [...Array(20)].map((_item, i) => (
            <li
              key={`placeholder-${i}`}
              className="col-span-1 flex flex-col text-center items-center"
            >
              <TitleCard.Placeholder canExpand />
            </li>
          ))}
      </ul>
    </>
  );
};

export default ListView;
