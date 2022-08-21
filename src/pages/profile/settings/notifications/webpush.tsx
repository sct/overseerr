import UserSettings from '@/components/UserProfile/UserSettings';
import UserNotificationSettings from '@/components/UserProfile/UserSettings/UserNotificationSettings';
import UserWebPushSettings from '@/components/UserProfile/UserSettings/UserNotificationSettings/UserNotificationsWebPush';
import type { NextPage } from 'next';

const WebPushProfileNotificationsPage: NextPage = () => {
  return (
    <UserSettings>
      <UserNotificationSettings>
        <UserWebPushSettings />
      </UserNotificationSettings>
    </UserSettings>
  );
};

export default WebPushProfileNotificationsPage;
