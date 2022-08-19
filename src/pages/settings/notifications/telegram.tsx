import type { NextPage } from 'next';
import NotificationsTelegram from '../../../components/Settings/Notifications/NotificationsTelegram';
import SettingsLayout from '../../../components/Settings/SettingsLayout';
import SettingsNotifications from '../../../components/Settings/SettingsNotifications';
import useRouteGuard from '../../../hooks/useRouteGuard';
import { Permission } from '../../../hooks/useUser';

const NotificationsPage: NextPage = () => {
  useRouteGuard(Permission.ADMIN);
  return (
    <SettingsLayout>
      <SettingsNotifications>
        <NotificationsTelegram />
      </SettingsNotifications>
    </SettingsLayout>
  );
};

export default NotificationsPage;
