import CollectionRequestModal from '@app/components/RequestModal/CollectionRequestModal';
import MovieRequestModal from '@app/components/RequestModal/MovieRequestModal';
import TvRequestModal from '@app/components/RequestModal/TvRequestModal';
import ArtistRequestModal from '@app/components/RequestModal/ArtistRequestModal';
import AlbumRequestModal from '@app/components/RequestModal/AlbumRequestModal';
import { Transition } from '@headlessui/react';
import type { MediaStatus } from '@server/constants/media';
import type { MediaRequest } from '@server/entity/MediaRequest';

interface RequestModalProps {
  show: boolean;
  type: 'movie' | 'tv' | 'collection' | 'artist' | 'album';
  tmdbId?: number;
  mbid?: string; // MusicBrainz ID for music requests
  is4k?: boolean;
  editRequest?: MediaRequest;
  onComplete?: (newStatus: MediaStatus) => void;
  onCancel?: () => void;
  onUpdating?: (isUpdating: boolean) => void;
}

const RequestModal = ({
  type,
  show,
  tmdbId,
  mbid,
  is4k,
  editRequest,
  onComplete,
  onUpdating,
  onCancel,
}: RequestModalProps) => {
  return (
    <Transition
      as="div"
      enter="transition-opacity duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-300"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      show={show}
    >
      {type === 'movie' ? (
        <MovieRequestModal
          onComplete={onComplete}
          onCancel={onCancel}
          tmdbId={tmdbId || 0}
          onUpdating={onUpdating}
          is4k={is4k}
          editRequest={editRequest}
        />
      ) : type === 'tv' ? (
        <TvRequestModal
          onComplete={onComplete}
          onCancel={onCancel}
          tmdbId={tmdbId || 0}
          onUpdating={onUpdating}
          is4k={is4k}
          editRequest={editRequest}
        />
      ) : type === 'collection' ? (
        <CollectionRequestModal
          onComplete={onComplete}
          onCancel={onCancel}
          tmdbId={tmdbId || 0}
          onUpdating={onUpdating}
          is4k={is4k}
        />
      ) : type === 'artist' ? (
        <ArtistRequestModal
          onComplete={onComplete}
          onCancel={onCancel}
          mbid={mbid || ''}
          onUpdating={onUpdating}
          editRequest={editRequest}
        />
      ) : type === 'album' ? (
        <AlbumRequestModal
          onComplete={onComplete}
          onCancel={onCancel}
          mbid={mbid || ''}
          onUpdating={onUpdating}
          editRequest={editRequest}
        />
      ) : null}
    </Transition>
  );
};

export default RequestModal;
