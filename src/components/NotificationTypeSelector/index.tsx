import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import NotificationType from './NotificationType';

const messages = defineMessages({
  mediarequested: 'Media Requested',
  mediarequestedDescription:
    'Sends a notification when new media is requested. For certain agents, this will only send the notification to admins or users with the "Manage Requests" permission.',
  mediaapproved: 'Media Approved',
  mediaapprovedDescription: 'Sends a notification when media is approved.',
  mediaavailable: 'Media Available',
  mediaavailableDescription:
    'Sends a notification when media becomes available.',
  mediafailed: 'Media Failed',
  mediafailedDescription:
    'Sends a notification when media fails to be added to services (Radarr/Sonarr). For certain agents, this will only send the notification to admins or users with the "Manage Requests" permission.',
});

export const hasNotificationType = (
  types: Notification | Notification[],
  value: number
): boolean => {
  let total = 0;

  if (types === 0) {
    return true;
  }

  if (Array.isArray(types)) {
    total = types.reduce((a, v) => a + v, 0);
  } else {
    total = types;
  }

  return !!(value & total);
};

export enum Notification {
  MEDIA_PENDING = 2,
  MEDIA_APPROVED = 4,
  MEDIA_AVAILABLE = 8,
  MEDIA_FAILED = 16,
  TEST_NOTIFICATION = 32,
}

export interface NotificationItem {
  id: string;
  name: string;
  description: string;
  value: Notification;
  children?: NotificationItem[];
}

interface NotificationTypeSelectorProps {
  currentTypes: number;
  onUpdate: (newTypes: number) => void;
}

const NotificationTypeSelector: React.FC<NotificationTypeSelectorProps> = ({
  currentTypes,
  onUpdate,
}) => {
  const intl = useIntl();

  const types: NotificationItem[] = [
    {
      id: 'media-requested',
      name: intl.formatMessage(messages.mediarequested),
      description: intl.formatMessage(messages.mediarequestedDescription),
      value: Notification.MEDIA_PENDING,
    },
    {
      id: 'media-approved',
      name: intl.formatMessage(messages.mediaapproved),
      description: intl.formatMessage(messages.mediaapprovedDescription),
      value: Notification.MEDIA_APPROVED,
    },
    {
      id: 'media-available',
      name: intl.formatMessage(messages.mediaavailable),
      description: intl.formatMessage(messages.mediaavailableDescription),
      value: Notification.MEDIA_AVAILABLE,
    },
    {
      id: 'media-failed',
      name: intl.formatMessage(messages.mediafailed),
      description: intl.formatMessage(messages.mediafailedDescription),
      value: Notification.MEDIA_FAILED,
    },
  ];

  return (
    <>
      {types.map((type) => (
        <NotificationType
          key={`notification-type-${type.id}`}
          option={type}
          currentTypes={currentTypes}
          onUpdate={onUpdate}
        />
      ))}
    </>
  );
};

export default NotificationTypeSelector;
