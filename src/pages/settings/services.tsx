import type { NextPage } from 'next';
import React from 'react';
import SettingsLayout from '../../components/Settings/SettingsLayout';
import SettingsServices from '../../components/Settings/SettingsServices';
import useRouteGuard from '../../hooks/useRouteGuard';
import { Permission } from '../../hooks/useUser';

const ServicesSettingsPage: NextPage = () => {
  useRouteGuard(Permission.ADMIN);
  return (
    <SettingsLayout>
      <SettingsServices />
    </SettingsLayout>
  );
};

export default ServicesSettingsPage;
