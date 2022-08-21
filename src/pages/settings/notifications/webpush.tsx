import NotificationsWebPush from '@/components/Settings/Notifications/NotificationsWebPush';
import SettingsLayout from '@/components/Settings/SettingsLayout';
import SettingsNotifications from '@/components/Settings/SettingsNotifications';
import useRouteGuard from '@/hooks/useRouteGuard';
import { Permission } from '@/hooks/useUser';
import type { NextPage } from 'next';

const NotificationsWebPushPage: NextPage = () => {
  useRouteGuard(Permission.ADMIN);
  return (
    <SettingsLayout>
      <SettingsNotifications>
        <NotificationsWebPush />
      </SettingsNotifications>
    </SettingsLayout>
  );
};

export default NotificationsWebPushPage;
