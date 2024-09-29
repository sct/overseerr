import Button from '@app/components/Common/Button';
import useSearchInput from '@app/hooks/useSearchInput';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/router';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  searchMoviesAndTV: 'Search Movies & TV',
  searchMusic: 'Search Music',
});

const SearchInput = () => {
  const router = useRouter();
  const intl = useIntl();
  const { searchValue, setSearchValue, setIsOpen, clear } = useSearchInput();

  const videoSearch = () => {
    router.replace({
      pathname: searchValue.length > 0 ? '/search' : '/',
      query: {
        ...router.query,
        query: searchValue,
      },
    });
  };

  const musicSearch = () => {
    router.replace({
      pathname: searchValue.length > 0 ? '/music-search' : '/',
      query: {
        ...router.query,
        query: searchValue,
      },
    });
  };

  return (
    <div className="flex flex-1">
      <div className="flex w-full portrait:flex-col">
        <label htmlFor="search_field" className="sr-only">
          Search
        </label>
        <div className="relative flex w-full items-center text-white focus-within:text-gray-200">
          <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
            <MagnifyingGlassIcon className="h-5 w-5" />
          </div>
          <input
            id="search_field"
            style={{ paddingRight: searchValue.length > 0 ? '1.75rem' : '' }}
            className="block w-full rounded-full border border-gray-600 bg-gray-900 bg-opacity-80 py-2 pl-10 text-white placeholder-gray-300 hover:border-gray-500 focus:border-gray-500 focus:bg-opacity-100 focus:placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-base"
            type="search"
            autoComplete="off"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onBlur={() => {
              if (searchValue === '') {
                setIsOpen(false);
              }
            }}
            onKeyUp={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                videoSearch();
              }
            }}
          />
          {searchValue.length > 0 && (
            <button
              className="absolute inset-y-0 right-2 m-auto h-7 w-7 border-none p-1 text-gray-400 outline-none transition hover:text-white focus:border-none focus:outline-none"
              onClick={() => clear()}
            >
              <XCircleIcon className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="flex justify-center portrait:mt-2">
          <Button
            buttonType="primary"
            onClick={videoSearch}
            className="ml-2 mr-2"
          >
            {intl.formatMessage(messages.searchMoviesAndTV)}
          </Button>
          <Button buttonType="primary" onClick={musicSearch} className="mr-2">
            {intl.formatMessage(messages.searchMusic)}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SearchInput;
