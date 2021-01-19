import React from 'react';
import { MediaStatus } from '../../../server/constants/media';
import Badge from '../Common/Badge';
import { defineMessages, useIntl } from 'react-intl';
import globalMessages from '../../i18n/globalMessages';

const messages = defineMessages({
  status4k: '4K {status}',
});

interface StatusBadgeProps {
  status?: MediaStatus;
  is4k?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, is4k }) => {
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
            {intl.formatMessage(messages.status4k, {
              status: intl.formatMessage(globalMessages.requested),
            })}
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
          {intl.formatMessage(globalMessages.available)}
        </Badge>
      );
    case MediaStatus.PARTIALLY_AVAILABLE:
      return (
        <Badge badgeType="success">
          {intl.formatMessage(globalMessages.partiallyavailable)}
        </Badge>
      );
    case MediaStatus.PROCESSING:
      return (
        <Badge badgeType="primary">
          {intl.formatMessage(globalMessages.requested)}
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
