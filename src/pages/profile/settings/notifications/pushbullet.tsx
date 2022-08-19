import type { NextPage } from 'next';

import UserSettings from '../../../../components/UserProfile/UserSettings';
import UserNotificationSettings from '../../../../components/UserProfile/UserSettings/UserNotificationSettings';
import UserNotificationsPushbullet from '../../../../components/UserProfile/UserSettings/UserNotificationSettings/UserNotificationsPushbullet';

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
