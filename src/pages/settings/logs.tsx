import type { NextPage } from 'next';
import React from 'react';
import SettingsLayout from '../../components/Settings/SettingsLayout';
import SettingsLogs from '../../components/Settings/SettingsLogs';
import useRouteGuard from '../../hooks/useRouteGuard';
import { Permission } from '../../hooks/useUser';

const SettingsLogsPage: NextPage = () => {
  useRouteGuard(Permission.ADMIN);
  return (
    <SettingsLayout>
      <SettingsLogs />
    </SettingsLayout>
  );
};

export default SettingsLogsPage;
