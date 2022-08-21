import SettingsLayout from '@/components/Settings/SettingsLayout';
import SettingsServices from '@/components/Settings/SettingsServices';
import useRouteGuard from '@/hooks/useRouteGuard';
import { Permission } from '@/hooks/useUser';
import type { NextPage } from 'next';

const ServicesSettingsPage: NextPage = () => {
  useRouteGuard(Permission.ADMIN);
  return (
    <SettingsLayout>
      <SettingsServices />
    </SettingsLayout>
  );
};

export default ServicesSettingsPage;
