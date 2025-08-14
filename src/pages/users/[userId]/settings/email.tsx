import UserSettings from '@app/components/UserProfile/UserSettings';
import UserEmailChange from '@app/components/UserProfile/UserSettings/UserEmailChange';
import useRouteGuard from '@app/hooks/useRouteGuard';
import { Permission } from '@app/hooks/useUser';
import type { NextPage } from 'next';

const UserEmailPage: NextPage = () => {
  useRouteGuard(Permission.MANAGE_USERS);
  return (
    <UserSettings>
      <UserEmailChange />
    </UserSettings>
  );
};

export default UserEmailPage;
