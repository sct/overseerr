import { NextPage } from 'next';
import React from 'react';
import NotificationsLunaSea from '../../../components/Settings/Notifications/NotificationsLunaSea';
import SettingsLayout from '../../../components/Settings/SettingsLayout';
import SettingsNotifications from '../../../components/Settings/SettingsNotifications';

const NotificationsPage: NextPage = () => {
  return (
    <SettingsLayout>
      <SettingsNotifications>
        <NotificationsLunaSea />
      </SettingsNotifications>
    </SettingsLayout>
  );
};

export default NotificationsPage;
