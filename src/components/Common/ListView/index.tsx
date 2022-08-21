import { useIntl } from 'react-intl';
import type { WatchlistItem } from '../../../../server/interfaces/api/discoverInterfaces';
import type {
  MovieResult,
  PersonResult,
  TvResult,
} from '../../../../server/models/Search';
import useVerticalScroll from '../../../hooks/useVerticalScroll';
import globalMessages from '../../../i18n/globalMessages';
import PersonCard from '../../PersonCard';
import TitleCard from '../../TitleCard';
import TmdbTitleCard from '../../TitleCard/TmdbTitleCard';

type ListViewProps = {
  items?: (TvResult | MovieResult | PersonResult)[];
  plexItems?: WatchlistItem[];
  isEmpty?: boolean;
  isLoading?: boolean;
  isReachingEnd?: boolean;
  onScrollBottom: () => void;
};

const ListView = ({
  items,
  isEmpty,
  isLoading,
  onScrollBottom,
  isReachingEnd,
  plexItems,
}: ListViewProps) => {
  const intl = useIntl();
  useVerticalScroll(onScrollBottom, !isLoading && !isEmpty && !isReachingEnd);
  return (
    <>
      {isEmpty && (
        <div className="mt-64 w-full text-center text-2xl text-gray-400">
          {intl.formatMessage(globalMessages.noresults)}
        </div>
      )}
      <ul className="cards-vertical">
        {plexItems?.map((title, index) => {
          return (
            <li key={`${title.ratingKey}-${index}`}>
              <TmdbTitleCard
                id={title.tmdbId}
                tmdbId={title.tmdbId}
                type={title.mediaType}
                canExpand
              />
            </li>
          );
        })}
        {items?.map((title, index) => {
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
                  inProgress={
                    (title.mediaInfo?.downloadStatus ?? []).length > 0
                  }
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
                  inProgress={
                    (title.mediaInfo?.downloadStatus ?? []).length > 0
                  }
                  canExpand
                />
              );
              break;
            case 'person':
              titleCard = (
                <PersonCard
                  personId={title.id}
                  name={title.name}
                  profilePath={title.profilePath}
                  canExpand
                />
              );
              break;
          }

          return <li key={`${title.id}-${index}`}>{titleCard}</li>;
        })}
        {isLoading &&
          !isReachingEnd &&
          [...Array(20)].map((_item, i) => (
            <li key={`placeholder-${i}`}>
              <TitleCard.Placeholder canExpand />
            </li>
          ))}
      </ul>
    </>
  );
};

export default ListView;
