import React, { useEffect } from 'react';
import { User, useUser } from '../hooks/useUser';
import { useRouter } from 'next/dist/client/router';

interface UserContextProps {
  initialUser: User;
}

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
