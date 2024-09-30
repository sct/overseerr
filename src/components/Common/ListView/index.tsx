import PersonCard from '@app/components/PersonCard';
import TitleCard from '@app/components/TitleCard';
import TmdbTitleCard from '@app/components/TitleCard/TmdbTitleCard';
import useVerticalScroll from '@app/hooks/useVerticalScroll';
import globalMessages from '@app/i18n/globalMessages';
import type { WatchlistItem } from '@server/interfaces/api/discoverInterfaces';
import type {
  ArtistResult,
  CollectionResult,
  MovieResult,
  MusicResult,
  PersonResult,
  RecordingResult,
  ReleaseGroupResult,
  ReleaseResult,
  TvResult,
  WorkResult,
} from '@server/models/Search';
import { useIntl } from 'react-intl';

type ListViewProps = {
  items?: (
    | TvResult
    | MovieResult
    | PersonResult
    | CollectionResult
    | MusicResult
    | ArtistResult
    | ReleaseResult
    | ReleaseGroupResult
    | WorkResult
    | RecordingResult
  )[];
  jsxItems?: React.ReactNode[];
  plexItems?: WatchlistItem[];
  isEmpty?: boolean;
  isLoading?: boolean;
  isReachingEnd?: boolean;
  onScrollBottom: () => void;
  force_big?: boolean;
};

const ListView = ({
  items,
  jsxItems,
  isEmpty,
  isLoading,
  onScrollBottom,
  isReachingEnd,
  plexItems,
  force_big = false,
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
                id={Number(title.tmdbId)}
                tmdbId={Number(title.tmdbId)}
                type={title.mediaType as 'movie' | 'tv'}
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
            case 'collection':
              titleCard = (
                <TitleCard
                  id={title.id}
                  image={title.posterPath}
                  summary={title.overview}
                  title={title.title}
                  mediaType={title.mediaType}
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
            case 'artist':
              titleCard = (
                <TitleCard
                  id={title.id}
                  image={title.posterPath}
                  title={title.name}
                  mediaType={title.mediaType}
                  canExpand
                  force_big={force_big}
                />
              );
              break;
            case 'release':
              titleCard = (
                <TitleCard
                  id={title.id}
                  image={title.posterPath}
                  title={title.title}
                  mediaType={title.mediaType}
                  canExpand
                  force_big={force_big}
                />
              );
              break;
            case 'release-group':
              titleCard = (
                <TitleCard
                  id={title.id}
                  image={title.posterPath}
                  title={title.title}
                  mediaType={title.mediaType}
                  canExpand
                />
              );
              break;
            case 'work':
              titleCard = (
                <TitleCard
                  id={title.id}
                  title={title.title}
                  mediaType={title.mediaType}
                  canExpand
                />
              );
              break;
            case 'recording':
              titleCard = (
                <TitleCard
                  id={title.id}
                  title={title.title}
                  mediaType={title.mediaType}
                  canExpand
                />
              );
              break;
          }

          return <li key={`${title.id}-${index}`}>{titleCard}</li>;
        })}
        {jsxItems}
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
