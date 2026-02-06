import TitleCard from '@app/components/TitleCard';
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
  releaseGroups?: { id: string }[];
  mediaInfo?: {
    status?: number;
  };
}

const ArtistTitleCard = ({ id, mbid, canExpand }: ArtistTitleCardProps) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
  });
  const url = `/api/v1/music/artist/${mbid}`;
  const { data: artist, error } = useSWR<ArtistDetails>(inView ? url : null);

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

  // Use album cover as fallback if no artist image, or placeholder
  const fallbackImage = artist.releaseGroups?.[0]?.id
    ? `/api/v1/music/album/${artist.releaseGroups[0].id}/cover`
    : undefined;
  const image =
    artist.imageUrl ||
    fallbackImage ||
    '/images/overseerr_poster_not_found_logo_top.png';

  return (
    <div className="w-full">
      <TitleCard
        id={id}
        image={image}
        status={artist.mediaInfo?.status}
        summary={undefined}
        title={artist.name}
        userScore={undefined}
        year={undefined}
        mediaType={'artist'}
        canExpand={canExpand}
        mbid={mbid}
      />
      {/* Artist name below card for easy recognition */}
      <div className="mt-2 px-1 text-center">
        <h3 className="line-clamp-2 text-sm font-medium text-gray-200">
          {artist.name}
        </h3>
      </div>
    </div>
  );
};

export default ArtistTitleCard;
