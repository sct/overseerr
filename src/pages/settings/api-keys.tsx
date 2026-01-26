import SettingsLayout from '@app/components/Settings/SettingsLayout';
import SettingsApiKeys from '@app/components/Settings/SettingsApiKeys';
import useRouteGuard from '@app/hooks/useRouteGuard';
import { Permission } from '@app/hooks/useUser';
import type { NextPage } from 'next';

const SettingsApiKeysPage: NextPage = () => {
  useRouteGuard(Permission.ADMIN);
  return (
    <SettingsLayout>
      <SettingsApiKeys />
    </SettingsLayout>
  );
};

export default SettingsApiKeysPage;

