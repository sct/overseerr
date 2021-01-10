import React from 'react';
import MovieRequestModal from './MovieRequestModal';
import type { MediaStatus } from '../../../server/constants/media';
import TvRequestModal from './TvRequestModal';
import Transition from '../Transition';

interface RequestModalProps {
  show: boolean;
  type: 'movie' | 'tv';
  tmdbId: number;
  is4k?: boolean;
  onComplete?: (newStatus: MediaStatus) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  onUpdating?: (isUpdating: boolean) => void;
}

const RequestModal: React.FC<RequestModalProps> = ({
  type,
  show,
  tmdbId,
  is4k,
  onComplete,
  onUpdating,
  onCancel,
}) => {
  if (type === 'tv') {
    return (
      <Transition
        enter="transition opacity-0 duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition opacity-100 duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        show={show}
      >
        <TvRequestModal
          onComplete={onComplete}
          onCancel={onCancel}
          tmdbId={tmdbId}
          onUpdating={onUpdating}
        />
      </Transition>
    );
  }

  return (
    <Transition
      enter="transition opacity-0 duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition opacity-100 duration-300"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      show={show}
    >
      <MovieRequestModal
        onComplete={onComplete}
        onCancel={onCancel}
        tmdbId={tmdbId}
        onUpdating={onUpdating}
        is4k={is4k}
      />
    </Transition>
  );
};

export default RequestModal;
