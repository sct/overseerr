import React from 'react';
import useSWR from 'swr';
import MovieRequestModal from './MovieRequestModal';
import type { MediaRequest } from '../../../server/entity/MediaRequest';
import type { MediaStatus } from '../../../server/constants/media';
import TvRequestModal from './TvRequestModal';
import { useTransition, animated } from 'react-spring';

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
  const transitions = useTransition(show, null, {
    from: { opacity: 0, backdropFilter: 'blur(0px)' },
    enter: { opacity: 1, backdropFilter: 'blur(3px)' },
    leave: { opacity: 0, backdropFilter: 'blur(0px)' },
    config: { tension: 500, velocity: 40, friction: 60 },
  });

  if (type === 'tv') {
    return (
      <>
        {transitions.map(
          ({ props, item, key }) =>
            item && (
              <TvRequestModal
                onComplete={onComplete}
                onCancel={onCancel}
                tmdbId={tmdbId}
                onUpdating={onUpdating}
                style={props}
                key={key}
              />
            )
        )}
      </>
    );
  }

  return (
    <>
      {transitions.map(
        ({ props, item, key }) =>
          item && (
            <MovieRequestModal
              onComplete={onComplete}
              onCancel={onCancel}
              tmdbId={tmdbId}
              onUpdating={onUpdating}
              style={props}
              key={key}
            />
          )
      )}
    </>
  );
};

export default RequestModal;
