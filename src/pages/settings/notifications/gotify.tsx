import NotificationsGotify from '@/components/Settings/Notifications/NotificationsGotify';
import SettingsLayout from '@/components/Settings/SettingsLayout';
import SettingsNotifications from '@/components/Settings/SettingsNotifications';
import useRouteGuard from '@/hooks/useRouteGuard';
import { Permission } from '@/hooks/useUser';
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
