import React from 'react';
import { MediaStatus } from '../../../server/constants/media';
import Badge from '../Common/Badge';
import { useIntl } from 'react-intl';
import globalMessages from '../../i18n/globalMessages';

interface StatusBadgeProps {
  status: MediaStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const intl = useIntl();

  return (
    <>
      {status === MediaStatus.AVAILABLE && (
        <Badge badgeType="success">
          {intl.formatMessage(globalMessages.available)}
        </Badge>
      )}
      {status === MediaStatus.PARTIALLY_AVAILABLE && (
        <Badge badgeType="success">
          {intl.formatMessage(globalMessages.partiallyavailable)}
        </Badge>
      )}
      {status === MediaStatus.PROCESSING && (
        <Badge badgeType="danger">
          {intl.formatMessage(globalMessages.unavailable)}
        </Badge>
      )}
      {status === MediaStatus.PENDING && (
        <Badge badgeType="warning">
          {intl.formatMessage(globalMessages.pending)}
        </Badge>
      )}
    </>
  );
};

export default StatusBadge;
