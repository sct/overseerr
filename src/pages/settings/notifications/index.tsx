import { NextPage } from 'next';
import React from 'react';
import SettingsLayout from '../../../components/Settings/SettingsLayout';
import SettingsNotifications from '../../../components/Settings/SettingsNotifications';

const NotificationsPage: NextPage = () => {
  return (
    <SettingsLayout>
      <SettingsNotifications>N/A</SettingsNotifications>
    </SettingsLayout>
  );
};

export default NotificationsPage;
