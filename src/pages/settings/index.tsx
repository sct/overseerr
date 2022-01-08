import React from 'react';
import type { NextPage } from 'next';
import SettingsLayout from '../../components/Settings/SettingsLayout';
import SettingsMain from '../../components/Settings/SettingsMain';
import useRouteGuard from '../../hooks/useRouteGuard';
import { Permission } from '../../hooks/useUser';

const SettingsPage: NextPage = () => {
  useRouteGuard(Permission.ADMIN);
  return (
    <SettingsLayout>
      <SettingsMain />
    </SettingsLayout>
  );
};

export default SettingsPage;
