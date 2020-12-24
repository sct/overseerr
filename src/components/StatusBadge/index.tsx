import React from 'react';
import { MediaStatus } from '../../../server/constants/media';
import Badge from '../Common/Badge';
import { useIntl } from 'react-intl';
import globalMessages from '../../i18n/globalMessages';

interface StatusBadgeProps {
  status?: MediaStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const intl = useIntl();

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
