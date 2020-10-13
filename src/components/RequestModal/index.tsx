import React from 'react';
import useSWR from 'swr';
import MovieRequestModal from './MovieRequestModal';
import type { MediaRequest } from '../../../server/entity/MediaRequest';
import type { MediaStatus } from '../../../server/constants/media';
import TvRequestModal from './TvRequestModal';

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
  onError,
  onUpdating,
  onCancel,
}) => {
  if (type === 'tv') {
    return (
      <TvRequestModal
        onComplete={onComplete}
        onCancel={onCancel}
        visible={show}
        tmdbId={tmdbId}
        onUpdating={onUpdating}
      />
    );
  }

  return (
    <MovieRequestModal
      onComplete={onComplete}
      onCancel={onCancel}
      visible={show}
      tmdbId={tmdbId}
      onUpdating={onUpdating}
    />
  );
};

export default RequestModal;
