import React, { useEffect } from 'react';
import MovieRequestModal from './MovieRequestModal';
import type { MediaStatus } from '../../../server/constants/media';
import TvRequestModal from './TvRequestModal';
import Transition from '../Transition';
import useSWR from 'swr';
import LoadingSpinner from '../Common/LoadingSpinner';

interface RequestModalProps {
  show: boolean;
  type: 'movie' | 'tv';
  tmdbId: number;
  is4k?: boolean;
  editRequest?: number;
  onComplete?: (newStatus: MediaStatus) => void;
  onCancel?: () => void;
  onUpdating?: (isUpdating: boolean) => void;
}

const RequestModal: React.FC<RequestModalProps> = ({
  type,
  show,
  tmdbId,
  is4k,
  editRequest,
  onComplete,
  onUpdating,
  onCancel,
}) => {
  const { data, error, revalidate } = useSWR(
    editRequest && show ? `/api/v1/request/${editRequest}` : null
  );

  useEffect(() => {
    revalidate();
  }, [show, revalidate]);

  if (editRequest && !data && !error) {
    <Transition
      enter="transition opacity-0 duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition opacity-100 duration-300"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      show
      appear
    >
      <LoadingSpinner />
    </Transition>;
  }

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
          is4k={is4k}
          editRequest={editRequest ? data : null}
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
        editRequest={editRequest ? data : null}
      />
    </Transition>
  );
};

export default RequestModal;
