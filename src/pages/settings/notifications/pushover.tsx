import type { NextPage } from 'next';
import NotificationsPushover from '../../../components/Settings/Notifications/NotificationsPushover';
import SettingsLayout from '../../../components/Settings/SettingsLayout';
import SettingsNotifications from '../../../components/Settings/SettingsNotifications';
import useRouteGuard from '../../../hooks/useRouteGuard';
import { Permission } from '../../../hooks/useUser';

const NotificationsPage: NextPage = () => {
  useRouteGuard(Permission.ADMIN);
  return (
    <SettingsLayout>
      <SettingsNotifications>
        <NotificationsPushover />
      </SettingsNotifications>
    </SettingsLayout>
  );
};

export default NotificationsPage;
