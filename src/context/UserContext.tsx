import React, { useEffect } from 'react';
import { User, useUser } from '../hooks/useUser';
import { useRouter } from 'next/dist/client/router';

interface UserContextProps {
  initialUser: User;
}

/**
 * This UserContext serves the purpose of just preparing the useUser hooks
 * cache on server side render. It also will handle redirecting the user to
 * the login page if their session ever becomes invalid.
 */
export const UserContext: React.FC<UserContextProps> = ({
  initialUser,
  children,
}) => {
  const { user } = useUser({ initialData: initialUser });
  const router = useRouter();

  useEffect(() => {
    if (!router.pathname.match(/(setup|login)/) && !user) {
      router.push('/login');
    }
  }, [router, user]);

  return <>{children}</>;
};
