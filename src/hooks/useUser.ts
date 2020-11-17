import useSwr from 'swr';
import { useRef } from 'react';
import { hasPermission, Permission } from '../../server/lib/permissions';

export interface User {
  id: number;
  username: string;
  email: string;
  avatar: string;
  permissions: number;
}

export { Permission };

interface UserHookResponse {
  user?: User;
  loading: boolean;
  error: string;
  revalidate: () => Promise<boolean>;
  hasPermission: (permission: Permission | Permission[]) => boolean;
}

export const useUser = ({
  id,
  initialData,
}: { id?: number; initialData?: User } = {}): UserHookResponse => {
  const { data, error, revalidate } = useSwr<User>(
    id ? `/api/v1/user/${id}` : `/api/v1/auth/me`,
    {
      initialData,
      refreshInterval: 30000,
      errorRetryInterval: 30000,
      shouldRetryOnError: false,
    }
  );

  const checkPermission = (permission: Permission | Permission[]): boolean => {
    return hasPermission(permission, data?.permissions ?? 0);
  };

  return {
    user: data,
    loading: !data && !error,
    error,
    revalidate,
    hasPermission: checkPermission,
  };
};
