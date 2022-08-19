import type { NextPage } from 'next';

import NotificationsLunaSea from '../../../components/Settings/Notifications/NotificationsLunaSea';
import SettingsLayout from '../../../components/Settings/SettingsLayout';
import SettingsNotifications from '../../../components/Settings/SettingsNotifications';
import useRouteGuard from '../../../hooks/useRouteGuard';
import { Permission } from '../../../hooks/useUser';

const NotificationsPage: NextPage = () => {
  useRouteGuard(Permission.ADMIN);
  return (
    <SettingsLayout>
      <SettingsNotifications>
        <NotificationsLunaSea />
      </SettingsNotifications>
    </SettingsLayout>
  );
};

export default NotificationsPage;
