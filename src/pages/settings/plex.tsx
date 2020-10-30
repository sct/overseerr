import React from 'react';
import type { NextPage } from 'next';
import SettingsLayout from '../../components/Settings/SettingsLayout';
import SettingsPlex from '../../components/Settings/SettingsPlex';

const PlexSettingsPage: NextPage = () => {
  return (
    <SettingsLayout>
      <SettingsPlex />
    </SettingsLayout>
  );
};

export default PlexSettingsPage;
