import React from 'react';
import Modal from '../Common/Modal';
import { useUser } from '../../hooks/useUser';
import { Permission } from '../../../server/lib/permissions';
import { defineMessages, useIntl } from 'react-intl';
import { MediaRequest } from '../../../server/entity/MediaRequest';
import useSWR from 'swr';
import { MovieDetails } from '../../../server/models/Movie';
import { useToasts } from 'react-toast-notifications';
import axios from 'axios';
import type { MediaStatus } from '../../../server/constants/media';

const messages = defineMessages({
  requestadmin:
    'Your request will be immediately approved. Do you wish to continue?',
  cancelrequest:
    'This will remove your request. Are you sure you want to continue?',
});

interface RequestModalProps {
  request?: MediaRequest;
  tmdbId: number;
  visible?: boolean;
  onCancel?: () => void;
  onComplete?: (newStatus: MediaStatus) => void;
  onUpdating?: (isUpdating: boolean) => void;
}

const MovieRequestModal: React.FC<RequestModalProps> = ({
  visible,
  onCancel,
  onComplete,
  request,
  tmdbId,
  onUpdating,
}) => {
  const { addToast } = useToasts();
  const { data, error } = useSWR<MovieDetails>(`/api/v1/movie/${tmdbId}`);
  const intl = useIntl();
  const { hasPermission } = useUser();

  const sendRequest = async () => {
    if (onUpdating) {
      onUpdating(true);
    }
    const response = await axios.post<MediaRequest>('/api/v1/request', {
      mediaId: data?.id,
      mediaType: 'movie',
    });

    if (response.data) {
      if (onComplete) {
        onComplete(response.data.media.status);
      }
      addToast(
        <span>
          <strong>{data?.title}</strong> succesfully requested!
        </span>,
        { appearance: 'success', autoDismiss: true }
      );
      if (onUpdating) {
        onUpdating(false);
      }
    }
  };

  let text = hasPermission(Permission.MANAGE_REQUESTS)
    ? intl.formatMessage(messages.requestadmin)
    : undefined;

  if (request) {
    text = intl.formatMessage(messages.cancelrequest);
  }

  return (
    <Modal
      visible={visible}
      loading={!data && !error}
      backgroundClickable
      onCancel={onCancel}
      onOk={() => sendRequest()}
      title={!request ? `Request ${data?.title}` : 'Cancel Request'}
      okText={!request ? 'Request' : 'Cancel Request'}
      okButtonType={!!request ? 'danger' : 'primary'}
      iconSvg={
        !request ? (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        ) : (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        )
      }
    >
      {text}
    </Modal>
  );
};

export default MovieRequestModal;
