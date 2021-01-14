import React, { useCallback, useState, useEffect } from 'react';
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
import Alert from '../Common/Alert';

const messages = defineMessages({
  requestadmin:
    'Your request will be immediately approved. Do you wish to continue?',
  cancelrequest:
    'This will remove your request. Are you sure you want to continue?',
  requestSuccess: '<strong>{title}</strong> successfully requested!',
  requestCancel: 'Request for <strong>{title}</strong> cancelled',
  requesttitle: 'Request {title}',
  request4ktitle: 'Request {title} in 4K',
  close: 'Close',
  cancel: 'Cancel Request',
  cancelling: 'Cancelling...',
  pendingrequest: 'Pending request for {title}',
  pending4krequest: 'Pending request for {title} in 4K',
  requesting: 'Requesting...',
  request: 'Request',
  request4k: 'Request 4K',
  requestfrom: 'There is currently a pending request from {username}',
  request4kfrom: 'There is currently a pending 4K request from {username}',
});

interface RequestModalProps extends React.HTMLAttributes<HTMLDivElement> {
  tmdbId: number;
  is4k?: boolean;
  onCancel?: () => void;
  onComplete?: (newStatus: MediaStatus) => void;
  onUpdating?: (isUpdating: boolean) => void;
}

const MovieRequestModal: React.FC<RequestModalProps> = ({
  onCancel,
  onComplete,
  tmdbId,
  onUpdating,
  is4k,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { addToast } = useToasts();
  const { data, error } = useSWR<MovieDetails>(`/api/v1/movie/${tmdbId}`, {
    revalidateOnMount: true,
  });
  const intl = useIntl();
  const { user, hasPermission } = useUser();

  useEffect(() => {
    if (onUpdating) {
      onUpdating(isUpdating);
    }
  }, [isUpdating, onUpdating]);

  const sendRequest = useCallback(async () => {
    setIsUpdating(true);
    const response = await axios.post<MediaRequest>('/api/v1/request', {
      mediaId: data?.id,
      mediaType: 'movie',
      is4k,
    });

    if (response.data) {
      if (onComplete) {
        onComplete(
          hasPermission(Permission.AUTO_APPROVE) ||
            hasPermission(Permission.AUTO_APPROVE_MOVIE)
            ? MediaStatus.PROCESSING
            : MediaStatus.PENDING
        );
      }
      addToast(
        <span>
          {intl.formatMessage(messages.requestSuccess, {
            title: data?.title,
            strong: function strong(msg) {
              return <strong>{msg}</strong>;
            },
          })}
        </span>,
        { appearance: 'success', autoDismiss: true }
      );
      setIsUpdating(false);
    }
  }, [data, onComplete, addToast]);

  const activeRequest = data?.mediaInfo?.requests?.find(
    (request) => request.is4k === !!is4k
  );

  const cancelRequest = async () => {
    setIsUpdating(true);
    const response = await axios.delete<MediaRequest>(
      `/api/v1/request/${activeRequest?.id}`
    );

    if (response.status === 204) {
      if (onComplete) {
        onComplete(MediaStatus.UNKNOWN);
      }
      addToast(
        <span>
          {intl.formatMessage(messages.requestCancel, {
            title: data?.title,
            strong: function strong(msg) {
              return <strong>{msg}</strong>;
            },
          })}
        </span>,
        { appearance: 'success', autoDismiss: true }
      );
      setIsUpdating(false);
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
        okDisabled={isUpdating}
        title={intl.formatMessage(
          is4k ? messages.pending4krequest : messages.pendingrequest,
          {
            title: data?.title,
          }
        )}
        okText={
          isUpdating
            ? intl.formatMessage(messages.cancelling)
            : intl.formatMessage(messages.cancel)
        }
        okButtonType={'danger'}
        cancelText={intl.formatMessage(messages.close)}
        iconSvg={<DownloadIcon className="w-6 h-6" />}
      >
        {intl.formatMessage(
          is4k ? messages.request4kfrom : messages.requestfrom,
          {
            username: activeRequest.requestedBy.username,
          }
        )}
      </Modal>
    );
  }

  return (
    <Modal
      loading={!data && !error}
      backgroundClickable
      onCancel={onCancel}
      onOk={sendRequest}
      okDisabled={isUpdating}
      title={intl.formatMessage(
        is4k ? messages.request4ktitle : messages.requesttitle,
        { title: data?.title }
      )}
      okText={
        isUpdating
          ? intl.formatMessage(messages.requesting)
          : intl.formatMessage(is4k ? messages.request4k : messages.request)
      }
      okButtonType={'primary'}
      iconSvg={<DownloadIcon className="w-6 h-6" />}
    >
      <p className="mt-6">
        <Alert title="Auto Approval" type="info">
          {text}
        </Alert>
      </p>
      {hasPermission(Permission.REQUEST_ADVANCED) && (
        <>
          <div className="flex items-center mb-2 font-bold tracking-wider">
            <svg
              className="w-4 h-4 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M9.707 7.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L13 8.586V5h3a2 2 0 012 2v5a2 2 0 01-2 2H8a2 2 0 01-2-2V7a2 2 0 012-2h3v3.586L9.707 7.293zM11 3a1 1 0 112 0v2h-2V3z" />
              <path d="M4 9a2 2 0 00-2 2v5a2 2 0 002 2h8a2 2 0 002-2H4V9z" />
            </svg>
            Advanced Options
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-600 rounded-md">
            <div className="flex-grow mr-4">
              <label htmlFor="server" className="block text-sm font-medium">
                Destination Server
              </label>
              <select
                id="server"
                name="server"
                className="block w-full py-2 pl-3 pr-10 mt-1 text-base leading-6 text-white transition duration-150 ease-in-out bg-gray-800 border-gray-700 rounded-md form-select focus:outline-none focus:ring-blue focus:border-blue-300 sm:text-sm sm:leading-5"
              >
                <option>Main Radarr</option>
              </select>
            </div>
            <div className="flex-grow mr-4">
              <label htmlFor="server" className="block text-sm font-medium">
                Quality Profile
              </label>
              <select
                id="server"
                name="server"
                className="block w-full py-2 pl-3 pr-10 mt-1 text-base leading-6 text-white transition duration-150 ease-in-out bg-gray-800 border-gray-700 rounded-md form-select focus:outline-none focus:ring-blue focus:border-blue-300 sm:text-sm sm:leading-5"
              >
                <option>HD - 720p/1080p</option>
              </select>
            </div>
            <div className="flex-grow">
              <label htmlFor="server" className="block text-sm font-medium">
                Root Folder
              </label>
              <select
                id="server"
                name="server"
                className="block w-full py-2 pl-3 pr-10 mt-1 text-base leading-6 text-white transition duration-150 ease-in-out bg-gray-800 border-gray-700 rounded-md form-select focus:outline-none focus:ring-blue focus:border-blue-300 sm:text-sm sm:leading-5"
              >
                <option>/movies/</option>
              </select>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
};

export default MovieRequestModal;
