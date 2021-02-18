import { NextPage } from 'next';
import React from 'react';
import UserSettings from '../../../components/UserProfile/UserSettings';
import UserGeneralSettings from '../../../components/UserProfile/UserSettings/UserGeneralSettings';

const UserSettingsPage: NextPage = () => {
  return (
    <UserSettings>
      <UserGeneralSettings />
    </UserSettings>
  );
};

export default UserSettingsPage;
