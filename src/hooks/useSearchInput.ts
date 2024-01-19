/* eslint-disable react-hooks/exhaustive-deps */
import type { Nullable } from '@app/utils/typeHelpers';
import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';
import useDebouncedState from './useDebouncedState';

interface SearchObject {
  searchValue: string;
  searchOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  setSearchValue: Dispatch<SetStateAction<string>>;
  clear: () => void;
}

const useSearchInput = (): SearchObject => {
  const path = '';
  const query = '';
  const [searchOpen, setIsOpen] = useState(false);
  const [lastRoute, setLastRoute] = useState<Nullable<URL>>(null);
  const [searchValue, debouncedValue, setSearchValue] = useDebouncedState(
    query ?? ''
  );

  /**
   * This effect handles routing when the debounced search input
   * value changes.
   *
   * If we are not already on the /search route, then we push
   * in a new route. If we are, then we only replace the history.
   */
  useEffect(() => {
    if (debouncedValue !== '' && searchOpen) {
      if (path.startsWith('/search')) {
        history.replaceState(null, '', new URL(location.pathname));
        // {
        //   pathname: router.pathname,
        //   query: {
        //     ...router.query,
        //     query: debouncedValue,
        //   },
        // });
      } else {
        setLastRoute(new URL(location.pathname));
        history.pushState(null, '', new URL('/search'));
        //   pathname: '/search',
        //   query: { query: debouncedValue },
        // })
        window.scrollTo(0, 0);
      }
    }
  }, [debouncedValue]);

  /**
   * This effect is handling behavior when the search input is closed.
   *
   * If we have a lastRoute, we will route back to it. If we don't
   * (in the case of a deeplink) we take the user back to the index route
   */
  useEffect(() => {
    if (searchValue === '' && path.startsWith('/search') && !searchOpen) {
      if (lastRoute) {
        history.pushState(null, '', lastRoute);
        window.scrollTo(0, 0);
      } else {
        history.pushState(null, '', '/');
        window.scrollTo(0, 0);
      }
    }
  }, [searchOpen]);

  /**
   * This effect handles behavior for when the route is changed.
   *
   * If after a route change, the new debounced value is not the same
   * as the query value then we will update the searchValue to either the
   * new query or to an empty string (in the case of null). This makes sure
   * that the value in the searchbox is whatever the user last entered regardless
   * of routing to something like a detail page.
   *
   * If the new route is not /search and query is null, then we will close the
   * search if it is open.
   *
   * In the final case, we want the search to always be open in the case the user
   * is on /search
   */
  useEffect(() => {
    if (location.search !== debouncedValue) {
      setSearchValue(
        location.search ? decodeURIComponent(location.search as string) : ''
      );

      if (!path.startsWith('/search') && !location.search) {
        setIsOpen(false);
      }
    }

    if (path.startsWith('/search')) {
      setIsOpen(true);
    }
  }, [setSearchValue]);

  const clear = () => {
    setIsOpen(false);
    setSearchValue('');
  };

  return {
    searchValue,
    searchOpen,
    setIsOpen,
    setSearchValue,
    clear,
  };
};

export default useSearchInput;
