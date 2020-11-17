import React from 'react';
import { NextPage } from 'next';
import UserEdit from '../../../components/UserEdit';
import useRouteGuard from '../../../hooks/useRouteGuard';
import { Permission } from '../../../hooks/useUser';

const UserProfilePage: NextPage = () => {
  useRouteGuard(Permission.MANAGE_USERS);
  return <UserEdit />;
};

export default UserProfilePage;
