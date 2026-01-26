import TitleCard from '@app/components/TitleCard';
import { Permission, useUser } from '@app/hooks/useUser';
import { useInView } from 'react-intersection-observer';
import useSWR from 'swr';

export interface AlbumTitleCardProps {
  id: string; // MusicBrainz ID
  mbid: string;
  canExpand?: boolean;
}

interface AlbumDetails {
  id: string;
  title: string;
  primaryType?: string;
  firstReleaseDate?: string;
  disambiguation?: string;
  artistCredit?: Array<{
    artist: { id: string; name: string };
    name?: string;
  }>;
  mediaInfo?: {
    status?: number;
  };
}

const AlbumTitleCard = ({
  id,
  mbid,
  canExpand,
}: AlbumTitleCardProps) => {
  const { hasPermission } = useUser();

  const { ref, inView } = useInView({
    triggerOnce: true,
  });
  const url = `/api/v1/music/album/${mbid}`;
  const { data: album, error } = useSWR<AlbumDetails>(
    inView ? url : null
  );

  if (!album && !error) {
    return (
      <div ref={ref}>
        <TitleCard.Placeholder canExpand={canExpand} />
      </div>
    );
  }

  if (!album) {
    return null;
  }

  const artistName =
    album.artistCredit?.[0]?.name ||
    album.artistCredit?.[0]?.artist?.name ||
    '';

  return (
    <TitleCard
      id={id}
      image={undefined}
      status={album.mediaInfo?.status}
      summary={artistName ? `by ${artistName}` : undefined}
      title={album.title}
      userScore={undefined}
      year={album.firstReleaseDate}
      mediaType={'album'}
      canExpand={canExpand}
      mbid={mbid}
    />
  );
};

export default AlbumTitleCard;
