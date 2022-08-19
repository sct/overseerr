import type { NextPage } from 'next';

import SettingsAbout from '../../components/Settings/SettingsAbout';
import SettingsLayout from '../../components/Settings/SettingsLayout';
import useRouteGuard from '../../hooks/useRouteGuard';
import { Permission } from '../../hooks/useUser';

const SettingsAboutPage: NextPage = () => {
  useRouteGuard(Permission.ADMIN);
  return (
    <SettingsLayout>
      <SettingsAbout />
    </SettingsLayout>
  );
};

export default SettingsAboutPage;
