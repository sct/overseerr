import type { User } from '@app/hooks/useUser';
import { useUser } from '@app/hooks/useUser';
import { useRouter } from 'next/dist/client/router';
import { useEffect, useRef } from 'react';

interface UserContextProps {
  initialUser: User;
  children?: React.ReactNode;
}

/**
 * This UserContext serves the purpose of just preparing the useUser hooks
 * cache on server side render. It also will handle redirecting the user to
 * the login page if their session ever becomes invalid.
 */
export const UserContext = ({ initialUser, children }: UserContextProps) => {
  const { user, error, revalidate } = useUser({ initialData: initialUser });
  const router = useRouter();
  const routing = useRef(false);

  useEffect(() => {
    revalidate();
  }, [router.pathname, revalidate]);

  useEffect(() => {
    // Bypass login redirect only when explicitly set for testing, or ?skipSetup in non-production
    const skipSetup =
      process.env.NEXT_PUBLIC_SKIP_SETUP === 'true' ||
      (process.env.NODE_ENV !== 'production' &&
        new URLSearchParams(window.location.search).get('skipSetup') ===
          'true');

    if (
      !router.pathname.match(/(setup|login|resetpassword)/) &&
      (!user || error) &&
      !routing.current &&
      !skipSetup
    ) {
      routing.current = true;
      location.href = '/login';
    }
  }, [router, user, error]);

  return <>{children}</>;
};
