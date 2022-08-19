import type { NextPage } from 'next';

import RequestList from '../../../components/RequestList';
import useRouteGuard from '../../../hooks/useRouteGuard';
import { Permission } from '../../../hooks/useUser';

const UserRequestsPage: NextPage = () => {
  useRouteGuard([Permission.MANAGE_REQUESTS, Permission.REQUEST_VIEW], {
    type: 'or',
  });
  return <RequestList />;
};

export default UserRequestsPage;
