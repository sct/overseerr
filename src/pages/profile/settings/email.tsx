import UserSettings from '@app/components/UserProfile/UserSettings';
import UserEmailChange from '@app/components/UserProfile/UserSettings/UserEmailChange';
import type { NextPage } from 'next';

const UserEmailPage: NextPage = () => {
  return (
    <UserSettings>
      <UserEmailChange />
    </UserSettings>
  );
};

export default UserEmailPage;
