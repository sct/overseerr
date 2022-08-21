import UserSettings from '@/components/UserProfile/UserSettings';
import UserGeneralSettings from '@/components/UserProfile/UserSettings/UserGeneralSettings';
import type { NextPage } from 'next';

const UserSettingsPage: NextPage = () => {
  return (
    <UserSettings>
      <UserGeneralSettings />
    </UserSettings>
  );
};

export default UserSettingsPage;
