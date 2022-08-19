import type { NextPage } from 'next';
import UserSettings from '../../../components/UserProfile/UserSettings';
import UserPermissions from '../../../components/UserProfile/UserSettings/UserPermissions';

const UserPermissionsPage: NextPage = () => {
  return (
    <UserSettings>
      <UserPermissions />
    </UserSettings>
  );
};

export default UserPermissionsPage;
