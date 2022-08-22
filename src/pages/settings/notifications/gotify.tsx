import NotificationsGotify from '@app/components/Settings/Notifications/NotificationsGotify';
import SettingsLayout from '@app/components/Settings/SettingsLayout';
import SettingsNotifications from '@app/components/Settings/SettingsNotifications';
import useRouteGuard from '@app/hooks/useRouteGuard';
import { Permission } from '@app/hooks/useUser';
import type { NextPage } from 'next';

const NotificationsPage: NextPage = () => {
  useRouteGuard(Permission.ADMIN);
  return (
    <SettingsLayout>
      <SettingsNotifications>
        <NotificationsGotify />
      </SettingsNotifications>
    </SettingsLayout>
  );
};

export default NotificationsPage;
