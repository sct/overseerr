import useSwr from 'swr';
import {
  hasPermission,
  Permission,
  PermissionCheckOptions,
} from '../../server/lib/permissions';
import { UserType } from '../../server/constants/user';

export { Permission, UserType };

export interface User {
  id: number;
  plexUsername?: string;
  username?: string;
  displayName: string;
  email: string;
  avatar: string;
  permissions: number;
  userType: number;
}

interface UserHookResponse {
  user?: User;
  loading: boolean;
  error: string;
  revalidate: () => Promise<boolean>;
  hasPermission: (
    permission: Permission | Permission[],
    options?: PermissionCheckOptions
  ) => boolean;
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

  const checkPermission = (
    permission: Permission | Permission[],
    options?: PermissionCheckOptions
  ): boolean => {
    return hasPermission(permission, data?.permissions ?? 0, options);
  };

  return {
    user: data,
    loading: !data && !error,
    error,
    revalidate,
    hasPermission: checkPermission,
  };
};
