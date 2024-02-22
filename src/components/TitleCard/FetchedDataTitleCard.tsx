import TitleCard from '@app/components/TitleCard';
import { MediaType } from '@server/constants/media';
import type {
  ArtistResult,
  RecordingResult,
  ReleaseGroupResult,
  ReleaseResult,
  WorkResult,
} from '@server/models/Search';

export interface FetchedDataTitleCardProps {
  data:
    | ArtistResult
    | ReleaseGroupResult
    | ReleaseResult
    | WorkResult
    | RecordingResult;
  canExpand?: boolean;
}

const FetchedDataTitleCard = ({
  canExpand,
  data,
}: FetchedDataTitleCardProps) => {
  if (data.mediaType === 'artist') {
    const newData = data as ArtistResult;
    return (
      <TitleCard
        id={data.id}
        image={data.posterPath}
        status={newData.mediaInfo?.status}
        title={newData.name}
        mediaType={data.mediaType}
        canExpand={canExpand}
      />
    );
  } else if (data.mediaType === 'release-group') {
    return (
      <TitleCard
        id={data.id}
        image={data.posterPath}
        status={data.mediaInfo?.status}
        title={data.title}
        mediaType={data.mediaType}
        canExpand={canExpand}
        type={data.type ?? MediaType.MUSIC}
      />
    );
  } else if (data.mediaType === 'release') {
    return (
      <TitleCard
        id={data.id}
        image={data.posterPath}
        status={data.mediaInfo?.status}
        title={data.title}
        mediaType={data.mediaType}
        canExpand={canExpand}
        type={data.releaseGroup?.type ?? MediaType.MUSIC}
      />
    );
  }
  return null;
};

export default FetchedDataTitleCard;
