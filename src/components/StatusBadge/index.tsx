import React from 'react';
import { MediaStatus } from '../../../server/constants/media';
import Badge from '../Common/Badge';
import { defineMessages, useIntl } from 'react-intl';
import globalMessages from '../../i18n/globalMessages';
import Spinner from '../../assets/spinner.svg';

const messages = defineMessages({
  status4k: '4K {status}',
});

interface StatusBadgeProps {
  status?: MediaStatus;
  is4k?: boolean;
  inProgress?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  is4k = false,
  inProgress = false,
}) => {
  const intl = useIntl();

  if (is4k) {
    switch (status) {
      case MediaStatus.AVAILABLE:
        return (
          <Badge badgeType="success">
            {intl.formatMessage(messages.status4k, {
              status: intl.formatMessage(globalMessages.available),
            })}
          </Badge>
        );
      case MediaStatus.PARTIALLY_AVAILABLE:
        return (
          <Badge badgeType="success">
            {intl.formatMessage(messages.status4k, {
              status: intl.formatMessage(globalMessages.partiallyavailable),
            })}
          </Badge>
        );
      case MediaStatus.PROCESSING:
        return (
          <Badge badgeType="primary">
            <div className="flex items-center">
              <span>
                {intl.formatMessage(messages.status4k, {
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
          <Badge badgeType="warning">
            {intl.formatMessage(messages.status4k, {
              status: intl.formatMessage(globalMessages.pending),
            })}
          </Badge>
        );
      default:
        return null;
    }
  }

  switch (status) {
    case MediaStatus.AVAILABLE:
      return (
        <Badge badgeType="success">
          <div className="flex items-center">
            <span>{intl.formatMessage(globalMessages.available)}</span>
            {inProgress && <Spinner className="w-3 h-3 ml-1" />}
          </div>
        </Badge>
      );
    case MediaStatus.PARTIALLY_AVAILABLE:
      return (
        <Badge badgeType="success">
          <div className="flex items-center">
            <span>{intl.formatMessage(globalMessages.partiallyavailable)}</span>
            {inProgress && <Spinner className="w-3 h-3 ml-1" />}
          </div>
        </Badge>
      );
    case MediaStatus.PROCESSING:
      return (
        <Badge badgeType="primary">
          <div className="flex items-center">
            <span>
              {inProgress
                ? intl.formatMessage(globalMessages.processing)
                : intl.formatMessage(globalMessages.requested)}
            </span>
            {inProgress && <Spinner className="w-3 h-3 ml-1" />}
          </div>
        </Badge>
      );
    case MediaStatus.PENDING:
      return (
        <Badge badgeType="warning">
          {intl.formatMessage(globalMessages.pending)}
        </Badge>
      );
    default:
      return null;
  }
};

export default StatusBadge;
