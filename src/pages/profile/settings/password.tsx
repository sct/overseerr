import UserSettings from '@/components/UserProfile/UserSettings';
import UserPasswordChange from '@/components/UserProfile/UserSettings/UserPasswordChange';
import type { NextPage } from 'next';

const UserPassswordPage: NextPage = () => {
  return (
    <UserSettings>
      <UserPasswordChange />
    </UserSettings>
  );
};

export default UserPassswordPage;
