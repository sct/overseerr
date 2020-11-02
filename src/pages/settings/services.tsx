import React from 'react';
import type { NextPage } from 'next';
import SettingsLayout from '../../components/Settings/SettingsLayout';
import SettingsServices from '../../components/Settings/SettingsServices';

const ServicesSettingsPage: NextPage = () => {
  return (
    <SettingsLayout>
      <SettingsServices />
    </SettingsLayout>
  );
};

export default ServicesSettingsPage;
