import React from 'react';
import useSWR from 'swr';
import MovieRequestModal from './MovieRequestModal';
import type { MediaRequest } from '../../../server/entity/MediaRequest';
import type { MediaStatus } from '../../../server/constants/media';
import TvRequestModal from './TvRequestModal';

interface RequestModalProps {
  requestId?: number;
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
  requestId,
  show,
  tmdbId,
  onComplete,
  onError,
  onUpdating,
  onCancel,
}) => {
  const { data } = useSWR<MediaRequest>(
    requestId ? `/api/v1/request/${requestId}` : null
  );
  if (type === 'tv') {
    return (
      <TvRequestModal
        onComplete={onComplete}
        onCancel={onCancel}
        visible={show}
        request={data}
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
      request={data}
      tmdbId={tmdbId}
      onUpdating={onUpdating}
    />
  );
};

export default RequestModal;
