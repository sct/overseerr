import UserSettings from '@/components/UserProfile/UserSettings';
import UserNotificationSettings from '@/components/UserProfile/UserSettings/UserNotificationSettings';
import UserNotificationsPushbullet from '@/components/UserProfile/UserSettings/UserNotificationSettings/UserNotificationsPushbullet';
import type { NextPage } from 'next';

const NotificationsPage: NextPage = () => {
  return (
    <UserSettings>
      <UserNotificationSettings>
        <UserNotificationsPushbullet />
      </UserNotificationSettings>
    </UserSettings>
  );
};

export default NotificationsPage;
