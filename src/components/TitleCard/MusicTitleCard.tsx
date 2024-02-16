import TitleCard from '@app/components/TitleCard';
import { Permission, useUser } from '@app/hooks/useUser';
import type { ArtistResult,
              ReleaseGroupResult,
              ReleaseResult,
              WorkResult,
              RecordingResult } from '@server/models/Search';
import { useInView } from 'react-intersection-observer';
import useSWR from 'swr';

export interface MusicBrainTitleCardProps {
  id: number;
  mbId: string;
  mediaType: 'music';
  type?: 'artist' | 'release-group' | 'release' | 'recording' | 'work';
  canExpand?: boolean;
}

const TmdbTitleCard = ({
  id,
  mbId,
  mediaType,
  canExpand,
  type='artist'
}: MusicBrainTitleCardProps) => {
  const { hasPermission } = useUser();

  const { ref, inView } = useInView({
    triggerOnce: true,
  });
  const url = `/api/v1/music/${type}/${mbId}`;
  const { data, error } = useSWR<ArtistResult | ReleaseGroupResult | ReleaseResult | WorkResult | RecordingResult>(
    inView ? `${url}` : null
  );

  if (!data && !error) {
    return (
      <div ref={ref}>
        <TitleCard.Placeholder canExpand={canExpand} />
      </div>
    );
  }

  if (!data) {
    return hasPermission(Permission.ADMIN) ? (
      <TitleCard.ErrorCard
        id={id}
        mbId={mbId}
        type='music'
      />
    ) : null;
  }

  if (data.mediaType === 'artist') {
    const newData = data as ArtistResult;
    return (
      <TitleCard
        id={id}
        status={newData.mediaInfo?.status}
        title={newData.name}
        mediaType={mediaType}
        canExpand={canExpand}
      />
    );
  } else if (data.mediaType === 'release-group' || data.mediaType === 'release') {
    return (<TitleCard
        id={data.id}
        image={data.posterPath}
        status={data.mediaInfo?.status}
        title={data.title}
        mediaType={data.mediaType}
        canExpand={canExpand}
      />)
  }
  return null;
};

export default TmdbTitleCard;
