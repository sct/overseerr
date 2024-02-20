import TitleCard from '@app/components/TitleCard';
import { Permission, useUser } from '@app/hooks/useUser';
import type { SecondaryType } from '@server/constants/media';
import { MediaType } from '@server/constants/media';
import type {
  ArtistResult,
  RecordingResult,
  ReleaseGroupResult,
  ReleaseResult,
  WorkResult,
} from '@server/models/Search';
import { useInView } from 'react-intersection-observer';
import useSWR from 'swr';

export interface MusicBrainTitleCardProps {
  id: number;
  mbId: string;
  type?: SecondaryType;
  canExpand?: boolean;
  displayType?: string;
  preData?:
    | ArtistResult
    | ReleaseGroupResult
    | ReleaseResult
    | WorkResult
    | RecordingResult;
}

const MusicTitleCard = ({
  id,
  mbId,
  canExpand,
  type,
  displayType,
}: MusicBrainTitleCardProps) => {
  const { hasPermission } = useUser();

  const { ref, inView } = useInView({
    triggerOnce: true,
  });
  const url = `/api/v1/music/${type}/${mbId}`;
  const { data, error } = useSWR<
    | ArtistResult
    | ReleaseGroupResult
    | ReleaseResult
    | WorkResult
    | RecordingResult
  >(inView ? `${url}` : null);

  if (!data && !error) {
    return (
      <div ref={ref}>
        <TitleCard.Placeholder canExpand={canExpand} type="music" />
      </div>
    );
  }

  if (!data) {
    return hasPermission(Permission.ADMIN) ? (
      <TitleCard.ErrorCard id={id} mbId={mbId} type="music" />
    ) : null;
  }

  if (data.mediaType === 'artist') {
    const newData = data as ArtistResult;
    return (
      <TitleCard
        id={mbId}
        image={data.posterPath}
        status={newData.mediaInfo?.status}
        title={newData.name}
        mediaType={data.mediaType}
        canExpand={canExpand}
      />
    );
  } else if (
    data.mediaType === 'release-group' ||
    data.mediaType === 'release'
  ) {
    return (
      <TitleCard
        id={mbId}
        image={data.posterPath}
        status={data.mediaInfo?.status}
        title={data.title}
        mediaType={data.mediaType}
        canExpand={canExpand}
        type={displayType ?? MediaType.MUSIC}
      />
    );
  }
  return null;
};

export default MusicTitleCard;
