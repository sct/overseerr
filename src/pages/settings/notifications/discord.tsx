import NotificationsDiscord from '@/components/Settings/Notifications/NotificationsDiscord';
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
        <NotificationsDiscord />
      </SettingsNotifications>
    </SettingsLayout>
  );
};

export default NotificationsPage;
