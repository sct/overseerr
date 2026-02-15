import type { Sort } from '@app/components/UserList';
import type { User } from '@app/hooks/useUser';
import type { UserResultsResponse } from '@server/interfaces/api/userInterfaces';
import { isEqual } from 'lodash';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

export const useUsers = ({
  pageIndex,
  currentPageSize,
  searchString,
  currentSort,
}: {
  pageIndex: number;
  currentPageSize: number;
  searchString: string;
  currentSort: Sort;
}) => {
  const [users, setUsers] = useState<User[]>([]);

  const { data, mutate, isLoading } = useSWR<UserResultsResponse>(
    `/api/v1/user?take=${currentPageSize}&skip=${
      pageIndex * currentPageSize
    }&searchQuery=${
      searchString ? encodeURIComponent(searchString) : '%00'
    }&sort=${currentSort}`
  );

  useEffect(() => {
    if (!isLoading && data?.results && !isEqual(data.results, users)) {
      setUsers(data.results);
    }
  }, [isLoading, data?.results, users]);

  return { users, mutate, isLoading, pageInfo: data?.pageInfo };
};
