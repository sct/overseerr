import SettingsLayout from '@/components/Settings/SettingsLayout';
import SettingsPlex from '@/components/Settings/SettingsPlex';
import useRouteGuard from '@/hooks/useRouteGuard';
import { Permission } from '@/hooks/useUser';
import type { NextPage } from 'next';

const PlexSettingsPage: NextPage = () => {
  useRouteGuard(Permission.ADMIN);
  return (
    <SettingsLayout>
      <SettingsPlex />
    </SettingsLayout>
  );
};

export default PlexSettingsPage;
