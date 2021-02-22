import React from 'react';
import { NextPage } from 'next';
import RequestList from '../../../components/RequestList';
import useRouteGuard from '../../../hooks/useRouteGuard';
import { Permission } from '../../../hooks/useUser';

const UserRequestsPage: NextPage = () => {
  useRouteGuard(Permission.MANAGE_REQUESTS);
  return <RequestList />;
};

export default UserRequestsPage;
