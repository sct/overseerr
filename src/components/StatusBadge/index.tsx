import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { MediaStatus } from '../../../server/constants/media';
import Spinner from '../../assets/spinner.svg';
import globalMessages from '../../i18n/globalMessages';
import Badge from '../Common/Badge';

const messages = defineMessages({
  status: '{status}',
  status4k: '4K {status}',
});

interface StatusBadgeProps {
  status?: MediaStatus;
  is4k?: boolean;
  inProgress?: boolean;
  plexUrl?: string;
  serviceUrl?: string;
  tmdbId?: number;
  mediaType?: 'movie' | 'tv';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  is4k = false,
  inProgress = false,
  plexUrl,
  serviceUrl,
  tmdbId,
  mediaType,
}) => {
  const intl = useIntl();

  const manageLink =
    tmdbId && mediaType ? `/${mediaType}/${tmdbId}?manage` : undefined;

  switch (status) {
    case MediaStatus.AVAILABLE:
      return (
        <Badge badgeType="success" href={manageLink ?? plexUrl}>
          <div className="flex items-center">
            <span>
              {intl.formatMessage(is4k ? messages.status4k : messages.status, {
                status: intl.formatMessage(globalMessages.available),
              })}
            </span>
            {inProgress && <Spinner className="w-3 h-3 ml-1" />}
          </div>
        </Badge>
      );

    case MediaStatus.PARTIALLY_AVAILABLE:
      return (
        <Badge badgeType="success" href={manageLink ?? plexUrl}>
          <div className="flex items-center">
            <span>
              {intl.formatMessage(is4k ? messages.status4k : messages.status, {
                status: intl.formatMessage(globalMessages.partiallyavailable),
              })}
            </span>
            {inProgress && <Spinner className="w-3 h-3 ml-1" />}
          </div>
        </Badge>
      );

    case MediaStatus.PROCESSING:
      return (
        <Badge badgeType="primary" href={manageLink ?? serviceUrl}>
          <div className="flex items-center">
            <span>
              {intl.formatMessage(is4k ? messages.status4k : messages.status, {
                status: inProgress
                  ? intl.formatMessage(globalMessages.processing)
                  : intl.formatMessage(globalMessages.requested),
              })}
            </span>
            {inProgress && <Spinner className="w-3 h-3 ml-1" />}
          </div>
        </Badge>
      );

    case MediaStatus.PENDING:
      return (
        <Badge badgeType="warning" href={manageLink}>
          {intl.formatMessage(is4k ? messages.status4k : messages.status, {
            status: intl.formatMessage(globalMessages.pending),
          })}
        </Badge>
      );

    default:
      return null;
  }
};

export default StatusBadge;
