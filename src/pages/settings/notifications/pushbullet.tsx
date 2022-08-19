import type { NextPage } from 'next';

import NotificationsPushbullet from '../../../components/Settings/Notifications/NotificationsPushbullet';
import SettingsLayout from '../../../components/Settings/SettingsLayout';
import SettingsNotifications from '../../../components/Settings/SettingsNotifications';
import useRouteGuard from '../../../hooks/useRouteGuard';
import { Permission } from '../../../hooks/useUser';

const NotificationsPage: NextPage = () => {
  useRouteGuard(Permission.ADMIN);
  return (
    <SettingsLayout>
      <SettingsNotifications>
        <NotificationsPushbullet />
      </SettingsNotifications>
    </SettingsLayout>
  );
};

export default NotificationsPage;
