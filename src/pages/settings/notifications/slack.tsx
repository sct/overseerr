import type { NextPage } from 'next';
import NotificationsSlack from '../../../components/Settings/Notifications/NotificationsSlack';
import SettingsLayout from '../../../components/Settings/SettingsLayout';
import SettingsNotifications from '../../../components/Settings/SettingsNotifications';
import useRouteGuard from '../../../hooks/useRouteGuard';
import { Permission } from '../../../hooks/useUser';

const NotificationsSlackPage: NextPage = () => {
  useRouteGuard(Permission.ADMIN);
  return (
    <SettingsLayout>
      <SettingsNotifications>
        <NotificationsSlack />
      </SettingsNotifications>
    </SettingsLayout>
  );
};

export default NotificationsSlackPage;
