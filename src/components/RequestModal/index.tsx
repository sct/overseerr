import ArtistRequestModal from '@app/components/RequestModal/ArtistRequestModal';
import CollectionRequestModal from '@app/components/RequestModal/CollectionRequestModal';
import MovieRequestModal from '@app/components/RequestModal/MovieRequestModal';
import ReleaseRequestModal from '@app/components/RequestModal/ReleaseRequestModal';
import TvRequestModal from '@app/components/RequestModal/TvRequestModal';
import { Transition } from '@headlessui/react';
import type { MediaStatus, SecondaryType } from '@server/constants/media';
import type { MediaRequest } from '@server/entity/MediaRequest';

interface RequestModalProps {
  show: boolean;
  type: 'movie' | 'tv' | 'collection' | 'music';
  secondaryType?: SecondaryType;
  tmdbId?: number;
  mbId?: string;
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
  mbId,
  is4k,
  editRequest,
  onComplete,
  onUpdating,
  onCancel,
  secondaryType,
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
          tmdbId={tmdbId as number}
          onUpdating={onUpdating}
          is4k={is4k}
          editRequest={editRequest}
        />
      ) : type === 'tv' ? (
        <TvRequestModal
          onComplete={onComplete}
          onCancel={onCancel}
          tmdbId={tmdbId as number}
          onUpdating={onUpdating}
          is4k={is4k}
          editRequest={editRequest}
        />
      ) : type === 'collection' ? (
        <CollectionRequestModal
          onComplete={onComplete}
          onCancel={onCancel}
          tmdbId={tmdbId as number}
          onUpdating={onUpdating}
          is4k={is4k}
        />
      ) : type === 'music' && secondaryType === 'release' ? (
        <ReleaseRequestModal
          onComplete={onComplete}
          onCancel={onCancel}
          mbId={mbId as string}
          onUpdating={onUpdating}
          editRequest={editRequest}
        />
      ) : type === 'music' && secondaryType === 'artist' ? (
        <ArtistRequestModal
          onComplete={onComplete}
          onCancel={onCancel}
          mbId={mbId as string}
          onUpdating={onUpdating}
          editRequest={editRequest}
        />
      ) : null}
    </Transition>
  );
};

export default RequestModal;
