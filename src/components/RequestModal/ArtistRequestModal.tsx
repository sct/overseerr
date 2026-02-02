import Alert from '@app/components/Common/Alert';
import Modal from '@app/components/Common/Modal';
import type { RequestOverrides } from '@app/components/RequestModal/AdvancedRequester';
import AdvancedRequester from '@app/components/RequestModal/AdvancedRequester';
import QuotaDisplay from '@app/components/RequestModal/QuotaDisplay';
import { useUser } from '@app/hooks/useUser';
import globalMessages from '@app/i18n/globalMessages';
import { MediaRequestStatus, MediaStatus } from '@server/constants/media';
import type { MediaRequest } from '@server/entity/MediaRequest';
import type { QuotaResponse } from '@server/interfaces/api/userInterfaces';
import { Permission } from '@server/lib/permissions';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR, { mutate } from 'swr';

const messages = defineMessages({
  requestadmin: 'This request will be approved automatically.',
  alreadyrequested: 'Already Requested',
  requestSuccess: '<strong>{name}</strong> requested successfully!',
  requestCancel: 'Request for <strong>{name}</strong> canceled.',
  requestartisttitle: 'Request Artist',
  edit: 'Edit Request',
  approve: 'Approve Request',
  cancel: 'Cancel Request',
  pendingrequest: 'Pending Artist Request',
  requestfrom: "{username}'s request is pending approval.",
  errorediting: 'Something went wrong while editing the request.',
  requestedited: 'Request for <strong>{name}</strong> edited successfully!',
  requestApproved: 'Request for <strong>{name}</strong> approved!',
  requesterror: 'Something went wrong while submitting the request.',
  pendingapproval: 'Your request is pending approval.',
});

interface ArtistRequestModalProps extends React.HTMLAttributes<HTMLDivElement> {
  mbid: string;
  editRequest?: MediaRequest;
  onCancel?: () => void;
  onComplete?: (newStatus: MediaStatus) => void;
  onUpdating?: (isUpdating: boolean) => void;
}

interface ArtistDetails {
  id: string;
  name: string;
  sortName?: string;
  disambiguation?: string;
  country?: string;
  type?: string;
  area?: { id: string; name: string };
  mediaInfo?: {
    status?: number;
    requests?: MediaRequest[];
  };
}

const ArtistRequestModal = ({
  onCancel,
  onComplete,
  mbid,
  onUpdating,
  editRequest,
}: ArtistRequestModalProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [requestOverrides, setRequestOverrides] =
    useState<RequestOverrides | null>(null);
  const { addToast } = useToasts();
  const { data, error } = useSWR<ArtistDetails>(
    `/api/v1/music/artist/${mbid}`,
    {
      revalidateOnMount: true,
    }
  );
  const intl = useIntl();
  const { user, hasPermission } = useUser();
  const { data: quota } = useSWR<QuotaResponse>(
    user &&
      (!requestOverrides?.user?.id || hasPermission(Permission.MANAGE_USERS))
      ? `/api/v1/user/${requestOverrides?.user?.id ?? user.id}/quota`
      : null
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
          metadataProfileId: requestOverrides.metadataProfile,
          userId: requestOverrides.user?.id,
          tags: requestOverrides.tags,
        };
      }
      const response = await axios.post<MediaRequest>('/api/v1/request', {
        mediaId: 0, // Not used for music
        musicBrainzId: mbid,
        mediaType: 'artist',
        ...overrideParams,
      });
      mutate('/api/v1/request?filter=all&take=10&sort=modified&skip=0');
      mutate('/api/v1/request/count');

      if (response.data) {
        if (onComplete) {
          onComplete(
            hasPermission(Permission.AUTO_APPROVE) ||
              hasPermission(Permission.MANAGE_REQUESTS)
              ? MediaStatus.PROCESSING
              : MediaStatus.PENDING
          );
        }
        addToast(
          <span>
            {intl.formatMessage(messages.requestSuccess, {
              name: data?.name,
              strong: (msg: React.ReactNode) => <strong>{msg}</strong>,
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
  }, [
    requestOverrides,
    mbid,
    data?.name,
    onComplete,
    addToast,
    intl,
    hasPermission,
  ]);

  const cancelRequest = async () => {
    setIsUpdating(true);

    try {
      const response = await axios.delete<MediaRequest>(
        `/api/v1/request/${editRequest?.id}`
      );
      mutate('/api/v1/request?filter=all&take=10&sort=modified&skip=0');
      mutate('/api/v1/request/count');

      if (response.data) {
        if (onComplete) {
          onComplete(MediaStatus.UNKNOWN);
        }
        addToast(
          <span>
            {intl.formatMessage(messages.requestCancel, {
              name: data?.name,
              strong: (msg: React.ReactNode) => <strong>{msg}</strong>,
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
  };

  const approveRequest = async () => {
    setIsUpdating(true);

    try {
      await axios.post(`/api/v1/request/${editRequest?.id}/approve`);
      mutate('/api/v1/request?filter=all&take=10&sort=modified&skip=0');
      mutate('/api/v1/request/count');

      addToast(
        <span>
          {intl.formatMessage(messages.requestApproved, {
            name: data?.name,
            strong: (msg: React.ReactNode) => <strong>{msg}</strong>,
          })}
        </span>,
        { appearance: 'success', autoDismiss: true }
      );
    } catch (e) {
      addToast(intl.formatMessage(messages.errorediting), {
        appearance: 'error',
        autoDismiss: true,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const isOwner = editRequest && editRequest.requestedBy.id === user?.id;

  if (!data && !error) {
    return null;
  }

  if (!data) {
    return null;
  }

  const hasExistingRequest =
    data.mediaInfo?.requests &&
    data.mediaInfo.requests.length > 0 &&
    data.mediaInfo.requests.some(
      (req) =>
        req.status !== MediaRequestStatus.DECLINED &&
        req.status !== MediaRequestStatus.COMPLETED
    );

  return (
    <Modal
      loading={!data && !error}
      backgroundClickable
      onCancel={onCancel}
      onOk={() =>
        editRequest
          ? hasPermission(Permission.MANAGE_REQUESTS)
            ? approveRequest()
            : cancelRequest()
          : sendRequest()
      }
      title={intl.formatMessage(
        editRequest ? messages.pendingrequest : messages.requestartisttitle
      )}
      subTitle={data?.name}
      okText={
        editRequest
          ? hasPermission(Permission.MANAGE_REQUESTS)
            ? intl.formatMessage(messages.approve)
            : intl.formatMessage(messages.cancel)
          : hasExistingRequest
          ? intl.formatMessage(messages.alreadyrequested)
          : intl.formatMessage(globalMessages.request)
      }
      okDisabled={!editRequest && hasExistingRequest}
      okButtonType={
        editRequest
          ? hasPermission(Permission.MANAGE_REQUESTS)
            ? 'success'
            : 'danger'
          : 'primary'
      }
      cancelText={
        editRequest
          ? intl.formatMessage(globalMessages.close)
          : intl.formatMessage(globalMessages.cancel)
      }
    >
      {editRequest
        ? isOwner
          ? intl.formatMessage(messages.pendingapproval)
          : intl.formatMessage(messages.requestfrom, {
              username: editRequest?.requestedBy.displayName,
            })
        : null}
      {hasPermission([Permission.MANAGE_REQUESTS, Permission.AUTO_APPROVE], {
        type: 'or',
      }) &&
        !hasExistingRequest &&
        !editRequest && (
          <p className="mt-6">
            <Alert
              title={intl.formatMessage(messages.requestadmin)}
              type="info"
            />
          </p>
        )}
      {(quota?.music.limit ?? 0) > 0 && (
        <QuotaDisplay
          mediaType="music"
          quota={quota?.music}
          remaining={quota?.music.remaining}
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
          type="music"
          onChange={(overrides) => setRequestOverrides(overrides)}
          requestUser={editRequest?.requestedBy}
          defaultOverrides={
            editRequest
              ? {
                  folder: editRequest.rootFolder,
                  profile: editRequest.profileId,
                  metadataProfile: editRequest.metadataProfileId,
                  server: editRequest.serverId,
                  tags: editRequest.tags,
                }
              : undefined
          }
        />
      )}
    </Modal>
  );
};

export default ArtistRequestModal;
