import type { NextPage } from 'next';
import UserSettings from '../../../components/UserProfile/UserSettings';
import UserPasswordChange from '../../../components/UserProfile/UserSettings/UserPasswordChange';

const UserPassswordPage: NextPage = () => {
  return (
    <UserSettings>
      <UserPasswordChange />
    </UserSettings>
  );
};

export default UserPassswordPage;
