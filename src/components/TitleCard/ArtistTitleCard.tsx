import TitleCard from '@app/components/TitleCard';
import { Permission, useUser } from '@app/hooks/useUser';
import { useInView } from 'react-intersection-observer';
import useSWR from 'swr';

export interface ArtistTitleCardProps {
  id: string; // MusicBrainz ID
  mbid: string;
  canExpand?: boolean;
}

interface ArtistDetails {
  id: string;
  name: string;
  imageUrl?: string;
  sortName?: string;
  disambiguation?: string;
  country?: string;
  type?: string;
  area?: { id: string; name: string };
  mediaInfo?: {
    status?: number;
  };
}

const ArtistTitleCard = ({
  id,
  mbid,
  canExpand,
}: ArtistTitleCardProps) => {
  const { hasPermission } = useUser();

  const { ref, inView } = useInView({
    triggerOnce: true,
  });
  const url = `/api/v1/music/artist/${mbid}`;
  const { data: artist, error } = useSWR<ArtistDetails>(
    inView ? url : null
  );

  if (!artist && !error) {
    return (
      <div ref={ref}>
        <TitleCard.Placeholder canExpand={canExpand} />
      </div>
    );
  }

  if (!artist) {
    return null;
  }

  return (
    <TitleCard
      id={id}
      image={artist.imageUrl}
      status={artist.mediaInfo?.status}
      summary={undefined}
      title={artist.name}
      userScore={undefined}
      year={undefined}
      mediaType={'artist'}
      canExpand={canExpand}
      mbid={mbid}
    />
  );
};

export default ArtistTitleCard;
