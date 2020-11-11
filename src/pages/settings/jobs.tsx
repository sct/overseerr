import React from 'react';
import type { NextPage } from 'next';
import SettingsLayout from '../../components/Settings/SettingsLayout';
import SettingsJobs from '../../components/Settings/SettingsJobs';

const SettingsMainPage: NextPage = () => {
  return (
    <SettingsLayout>
      <SettingsJobs />
    </SettingsLayout>
  );
};

export default SettingsMainPage;
