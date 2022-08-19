import type { NextPage } from 'next';

import IssueList from '../../components/IssueList';
import useRouteGuard from '../../hooks/useRouteGuard';
import { Permission } from '../../hooks/useUser';

const IssuePage: NextPage = () => {
  useRouteGuard(
    [
      Permission.MANAGE_ISSUES,
      Permission.CREATE_ISSUES,
      Permission.VIEW_ISSUES,
    ],
    {
      type: 'or',
    }
  );
  return <IssueList />;
};

export default IssuePage;
