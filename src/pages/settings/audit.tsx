import SettingsLayout from '@app/components/Settings/SettingsLayout';
import SettingsAudit from '@app/components/Settings/SettingsAudit';
import useRouteGuard from '@app/hooks/useRouteGuard';
import { Permission } from '@app/hooks/useUser';
import type { NextPage } from 'next';

const SettingsAuditPage: NextPage = () => {
  useRouteGuard(Permission.ADMIN);
  return (
    <SettingsLayout>
      <SettingsAudit />
    </SettingsLayout>
  );
};

export default SettingsAuditPage;

