import type { NextPage } from 'next';
import SettingsJobs from '../../components/Settings/SettingsJobsCache';
import SettingsLayout from '../../components/Settings/SettingsLayout';
import useRouteGuard from '../../hooks/useRouteGuard';
import { Permission } from '../../hooks/useUser';

const SettingsMainPage: NextPage = () => {
  useRouteGuard(Permission.ADMIN);
  return (
    <SettingsLayout>
      <SettingsJobs />
    </SettingsLayout>
  );
};

export default SettingsMainPage;
