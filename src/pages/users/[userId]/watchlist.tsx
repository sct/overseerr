import type { NextPage } from 'next';
import DiscoverWatchlist from '@app/components/Discover/DiscoverWatchlist';
import useRouteGuard from '@app/hooks/useRouteGuard';
import { Permission } from '@app/hooks/useUser';

const UserRequestsPage: NextPage = () => {
  useRouteGuard(Permission.WATCHLIST_VIEW);
  return <DiscoverWatchlist />;
};

export default UserRequestsPage;
