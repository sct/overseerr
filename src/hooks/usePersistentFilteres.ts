import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef } from 'react';

const usePersistentFilters = (localStorageKey: string) => {
  const router = useRouter();
  const initialLoadCompleteRef = useRef(false);

  const handleRouterReplace = useCallback(() => {
    const savedFilters = localStorage.getItem(localStorageKey);
    const parsedFilters = savedFilters ? JSON.parse(savedFilters) : null;
    router.replace(
      { pathname: router.pathname, query: parsedFilters },
      undefined,
      { shallow: true }
    );
    initialLoadCompleteRef.current = true;
  }, [router, localStorageKey]);

  useEffect(() => {
    if (!initialLoadCompleteRef.current && router.isReady) {
      handleRouterReplace();
    } else if (initialLoadCompleteRef.current && router.isReady) {
      localStorage.setItem(localStorageKey, JSON.stringify(router.query));
    }
  }, [router.isReady, router.query, handleRouterReplace, localStorageKey]);
};

export default usePersistentFilters;
