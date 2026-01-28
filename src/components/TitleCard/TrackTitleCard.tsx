import TitleCard from '@app/components/TitleCard';
import { useInView } from 'react-intersection-observer';
import useSWR from 'swr';

export interface TrackTitleCardProps {
  id: string; // MusicBrainz ID
  mbid: string;
  canExpand?: boolean;
}

interface TrackDetails {
  id: string;
  title: string;
  firstReleaseDate?: string;
  artistCredit?: {
    artist: { id: string; name: string };
    name?: string;
  }[];
  mediaInfo?: {
    status?: number;
  };
}

const TrackTitleCard = ({ id, mbid, canExpand }: TrackTitleCardProps) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
  });
  const url = `/api/v1/music/track/${mbid}`;
  const { data: track, error } = useSWR<TrackDetails>(inView ? url : null);

  if (!track && !error) {
    return (
      <div ref={ref}>
        <TitleCard.Placeholder canExpand={canExpand} />
      </div>
    );
  }

  if (!track) {
    return null;
  }

  const artistName =
    track.artistCredit?.[0]?.name ||
    track.artistCredit?.[0]?.artist?.name ||
    '';

  return (
    <TitleCard
      id={id}
      image={undefined}
      status={track.mediaInfo?.status}
      summary={artistName ? `by ${artistName}` : undefined}
      title={track.title}
      userScore={undefined}
      year={track.firstReleaseDate}
      mediaType="track"
      canExpand={canExpand}
      mbid={mbid}
    />
  );
};

export default TrackTitleCard;
