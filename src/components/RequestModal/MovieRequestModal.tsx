import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';
import {
  MediaRequestStatus,
  MediaStatus,
} from '../../../server/constants/media';
import { MediaRequest } from '../../../server/entity/MediaRequest';
import { QuotaResponse } from '../../../server/interfaces/api/userInterfaces';
import { Permission } from '../../../server/lib/permissions';
import { MovieDetails } from '../../../server/models/Movie';
import DownloadIcon from '../../assets/download.svg';
import { useUser } from '../../hooks/useUser';
import globalMessages from '../../i18n/globalMessages';
import Alert from '../Common/Alert';
import Modal from '../Common/Modal';
import AdvancedRequester, { RequestOverrides } from './AdvancedRequester';
import QuotaDisplay from './QuotaDisplay';

const messages = defineMessages({
  requestadmin: 'This request will be approved automatically.',
  requestSuccess: '<strong>{title}</strong> requested successfully!',
  requestCancel: 'Request for <strong>{title}</strong> canceled.',
  requesttitle: 'Request {title}',
  request4ktitle: 'Request {title} in 4K',
  cancel: 'Cancel Request',
  pendingrequest: 'Pending Request for {title}',
  pending4krequest: 'Pending Request for {title} in 4K',
  requestfrom: 'There is currently a pending request from {username}.',
  request4kfrom: 'There is currently a pending 4K request from {username}.',
  errorediting: 'Something went wrong while editing the request.',
  requestedited: 'Request for <strong>{title}</strong> edited successfully!',
  requesterror: 'Something went wrong while submitting the request.',
  pendingapproval: 'Your request is pending approval.',
});

interface RequestModalProps extends React.HTMLAttributes<HTMLDivElement> {
  tmdbId: number;
  is4k?: boolean;
  editRequest?: MediaRequest;
  onCancel?: () => void;
  onComplete?: (newStatus: MediaStatus) => void;
  onUpdating?: (isUpdating: boolean) => void;
}

const MovieRequestModal: React.FC<RequestModalProps> = ({
  onCancel,
  onComplete,
  tmdbId,
  onUpdating,
  editRequest,
  is4k = false,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [
    requestOverrides,
    setRequestOverrides,
  ] = useState<RequestOverrides | null>(null);
  const { addToast } = useToasts();
  const { data, error } = useSWR<MovieDetails>(`/api/v1/movie/${tmdbId}`, {
    revalidateOnMount: true,
  });
  const intl = useIntl();
  const { user, hasPermission } = useUser();
  const { data: quota } = useSWR<QuotaResponse>(
    user ? `/api/v1/user/${requestOverrides?.user?.id ?? user.id}/quota` : null
  );

  useEffect(() => {
    if (onUpdating) {
      onUpdating(isUpdating);
    }
  }, [isUpdating, onUpdating]);

  const sendRequest = useCallback(async () => {
    setIsUpdating(true);

    try {
      let overrideParams = {};
      if (requestOverrides) {
        overrideParams = {
          serverId: requestOverrides.server,
          profileId: requestOverrides.profile,
          rootFolder: requestOverrides.folder,
          userId: requestOverrides.user?.id,
          tags: requestOverrides.tags,
        };
      }
      const response = await axios.post<MediaRequest>('/api/v1/request', {
        mediaId: data?.id,
        mediaType: 'movie',
        is4k,
        ...overrideParams,
      });

      if (response.data) {
        if (onComplete) {
          onComplete(
            hasPermission(
              is4k ? Permission.AUTO_APPROVE_4K : Permission.AUTO_APPROVE
            ) ||
              hasPermission(
                is4k
                  ? Permission.AUTO_APPROVE_4K_MOVIE
                  : Permission.AUTO_APPROVE_MOVIE
              )
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
      }
    } catch (e) {
      addToast(intl.formatMessage(messages.requesterror), {
        appearance: 'error',
        autoDismiss: true,
      });
    } finally {
      setIsUpdating(false);
    }
  }, [data, onComplete, addToast, requestOverrides]);

  const activeRequest = data?.mediaInfo?.requests?.find(
    (request) => request.is4k === !!is4k
  );

  const cancelRequest = async () => {
    setIsUpdating(true);

    try {
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
      }
    } catch (e) {
      setIsUpdating(false);
    }
  };

  const updateRequest = async () => {
    setIsUpdating(true);

    try {
      await axios.put(`/api/v1/request/${editRequest?.id}`, {
        mediaType: 'movie',
        serverId: requestOverrides?.server,
        profileId: requestOverrides?.profile,
        rootFolder: requestOverrides?.folder,
        userId: requestOverrides?.user?.id,
        tags: requestOverrides?.tags,
      });

      addToast(
        <span>
          {intl.formatMessage(messages.requestedited, {
            title: data?.title,
            strong: function strong(msg) {
              return <strong>{msg}</strong>;
            },
          })}
        </span>,
        {
          appearance: 'success',
          autoDismiss: true,
        }
      );

      if (onComplete) {
        onComplete(MediaStatus.PENDING);
      }
    } catch (e) {
      addToast(<span>{intl.formatMessage(messages.errorediting)}</span>, {
        appearance: 'error',
        autoDismiss: true,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const isOwner = activeRequest
    ? activeRequest.requestedBy.id === user?.id
    : false;

  if (activeRequest?.status === MediaRequestStatus.PENDING) {
    return (
      <Modal
        loading={!data && !error}
        backgroundClickable
        onCancel={onCancel}
        title={intl.formatMessage(
          is4k ? messages.pending4krequest : messages.pendingrequest,
          {
            title: data?.title,
          }
        )}
        onOk={() => (isOwner ? cancelRequest() : updateRequest())}
        okDisabled={isUpdating}
        okText={
          isOwner
            ? isUpdating
              ? intl.formatMessage(globalMessages.canceling)
              : intl.formatMessage(messages.cancel)
            : intl.formatMessage(globalMessages.edit)
        }
        okButtonType={isOwner ? 'danger' : 'primary'}
        cancelText={intl.formatMessage(globalMessages.close)}
        iconSvg={<DownloadIcon className="w-6 h-6" />}
      >
        {isOwner
          ? intl.formatMessage(messages.pendingapproval)
          : intl.formatMessage(
              is4k ? messages.request4kfrom : messages.requestfrom,
              {
                username: activeRequest.requestedBy.displayName,
              }
            )}
        {(hasPermission(Permission.REQUEST_ADVANCED) ||
          hasPermission(Permission.MANAGE_REQUESTS)) && (
          <div className="mt-4">
            <AdvancedRequester
              type="movie"
              is4k={is4k}
              requestUser={editRequest?.requestedBy}
              defaultOverrides={
                editRequest
                  ? {
                      folder: editRequest.rootFolder,
                      profile: editRequest.profileId,
                      server: editRequest.serverId,
                      tags: editRequest.tags,
                    }
                  : undefined
              }
              onChange={(overrides) => {
                setRequestOverrides(overrides);
              }}
            />
          </div>
        )}
      </Modal>
    );
  }

  const hasAutoApprove = hasPermission(
    [
      Permission.MANAGE_REQUESTS,
      is4k ? Permission.AUTO_APPROVE_4K : Permission.AUTO_APPROVE,
      is4k ? Permission.AUTO_APPROVE_4K_MOVIE : Permission.AUTO_APPROVE_MOVIE,
    ],
    { type: 'or' }
  );

  return (
    <Modal
      loading={(!data && !error) || !quota}
      backgroundClickable
      onCancel={onCancel}
      onOk={sendRequest}
      okDisabled={isUpdating || quota?.movie.restricted}
      title={intl.formatMessage(
        is4k ? messages.request4ktitle : messages.requesttitle,
        { title: data?.title }
      )}
      okText={
        isUpdating
          ? intl.formatMessage(globalMessages.requesting)
          : intl.formatMessage(
              is4k ? globalMessages.request4k : globalMessages.request
            )
      }
      okButtonType={'primary'}
      iconSvg={<DownloadIcon className="w-6 h-6" />}
    >
      {hasAutoApprove && !quota?.movie.restricted && (
        <div className="mt-6">
          <Alert
            title={intl.formatMessage(messages.requestadmin)}
            type="info"
          />
        </div>
      )}
      {(quota?.movie.limit ?? 0) > 0 && (
        <QuotaDisplay
          mediaType="movie"
          quota={quota?.movie}
          userOverride={
            requestOverrides?.user && requestOverrides.user.id !== user?.id
              ? requestOverrides?.user?.id
              : undefined
          }
        />
      )}
      {(hasPermission(Permission.REQUEST_ADVANCED) ||
        hasPermission(Permission.MANAGE_REQUESTS)) && (
        <AdvancedRequester
          type="movie"
          is4k={is4k}
          onChange={(overrides) => {
            setRequestOverrides(overrides);
          }}
        />
      )}
    </Modal>
  );
};

export default MovieRequestModal;
