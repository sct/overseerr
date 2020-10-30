import React from 'react';
import { NextPage } from 'next';
import SettingsLayout from '../../components/Settings/SettingsLayout';
import SettingsMain from '../../components/Settings/SettingsMain';

const SettingsPage: NextPage = () => {
  return (
    <SettingsLayout>
      <SettingsMain />
    </SettingsLayout>
  );
};

export default SettingsPage;
