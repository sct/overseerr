import React from 'react';
import MovieRequestModal from './MovieRequestModal';
import type { MediaStatus } from '../../../server/constants/media';
import TvRequestModal from './TvRequestModal';
import Transition from '../Transition';

interface RequestModalProps {
  show: boolean;
  type: 'movie' | 'tv';
  tmdbId: number;
  onComplete?: (newStatus: MediaStatus) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  onUpdating?: (isUpdating: boolean) => void;
}

const RequestModal: React.FC<RequestModalProps> = ({
  type,
  show,
  tmdbId,
  onComplete,
  onUpdating,
  onCancel,
}) => {
  if (type === 'tv') {
    return (
      <Transition
        enter="opacity-0"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="opacity-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        appear
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
      enter="opacity-0"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="opacity-100"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      appear
      show={show}
    >
      <MovieRequestModal
        onComplete={onComplete}
        onCancel={onCancel}
        tmdbId={tmdbId}
        onUpdating={onUpdating}
      />
    </Transition>
  );
};

export default RequestModal;
