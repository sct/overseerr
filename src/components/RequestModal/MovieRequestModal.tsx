import React, { useCallback } from 'react';
import Modal from '../Common/Modal';
import { useUser } from '../../hooks/useUser';
import { Permission } from '../../../server/lib/permissions';
import { defineMessages, useIntl } from 'react-intl';
import { MediaRequest } from '../../../server/entity/MediaRequest';
import useSWR from 'swr';
import { MovieDetails } from '../../../server/models/Movie';
import { useToasts } from 'react-toast-notifications';
import axios from 'axios';
import {
  MediaStatus,
  MediaRequestStatus,
} from '../../../server/constants/media';
import DownloadIcon from '../../assets/download.svg';

const messages = defineMessages({
  requestadmin:
    'Your request will be immediately approved. Do you wish to continue?',
  cancelrequest:
    'This will remove your request. Are you sure you want to continue?',
});

interface RequestModalProps extends React.HTMLAttributes<HTMLDivElement> {
  tmdbId: number;
  onCancel?: () => void;
  onComplete?: (newStatus: MediaStatus) => void;
  onUpdating?: (isUpdating: boolean) => void;
}

const MovieRequestModal: React.FC<RequestModalProps> = ({
  onCancel,
  onComplete,
  tmdbId,
  onUpdating,
  ...props
}) => {
  const { addToast } = useToasts();
  const { data, error } = useSWR<MovieDetails>(`/api/v1/movie/${tmdbId}`, {
    revalidateOnMount: true,
  });
  const intl = useIntl();
  const { user, hasPermission } = useUser();

  const sendRequest = useCallback(async () => {
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
  }, [data, onComplete, onUpdating, addToast]);

  const activeRequest = data?.mediaInfo?.requests?.[0];

  console.log(activeRequest);

  const cancelRequest = async () => {
    if (onUpdating) {
      onUpdating(true);
    }
    const response = await axios.delete<MediaRequest>(
      `/api/v1/request/${activeRequest?.id}`
    );

    if (response.data) {
      if (onComplete) {
        onComplete(MediaStatus.UNKNOWN);
      }
      addToast(
        <span>
          <strong>{data?.title}</strong> request cancelled!
        </span>,
        { appearance: 'success', autoDismiss: true }
      );
      if (onUpdating) {
        onUpdating(false);
      }
    }
  };

  const isOwner = activeRequest
    ? activeRequest.requestedBy.id === user?.id ||
      hasPermission(Permission.MANAGE_REQUESTS)
    : false;

  const text = hasPermission(Permission.MANAGE_REQUESTS)
    ? intl.formatMessage(messages.requestadmin)
    : undefined;

  if (activeRequest?.status === MediaRequestStatus.PENDING) {
    return (
      <Modal
        loading={!data && !error}
        backgroundClickable
        onCancel={onCancel}
        onOk={isOwner ? () => cancelRequest() : undefined}
        title={`Pending request for ${data?.title}`}
        okText={'Cancel Request'}
        okButtonType={'danger'}
        cancelText="Close"
        iconSvg={<DownloadIcon className="w-6 h-6" />}
        {...props}
      >
        There is currently a pending request from{' '}
        <strong>{activeRequest.requestedBy.username}</strong>.
      </Modal>
    );
  }

  return (
    <Modal
      loading={!data && !error}
      backgroundClickable
      onCancel={onCancel}
      onOk={sendRequest}
      title={`Request ${data?.title}`}
      okText={'Request'}
      okButtonType={'primary'}
      iconSvg={<DownloadIcon className="w-6 h-6" />}
      {...props}
    >
      {text}
    </Modal>
  );
};

export default MovieRequestModal;
