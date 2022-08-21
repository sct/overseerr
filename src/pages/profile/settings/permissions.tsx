import UserSettings from '@/components/UserProfile/UserSettings';
import UserPermissions from '@/components/UserProfile/UserSettings/UserPermissions';
import type { NextPage } from 'next';

const UserPermissionsPage: NextPage = () => {
  return (
    <UserSettings>
      <UserPermissions />
    </UserSettings>
  );
};

export default UserPermissionsPage;
