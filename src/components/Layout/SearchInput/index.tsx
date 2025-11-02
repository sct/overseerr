import useSearchInput from '@app/hooks/useSearchInput';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  searchPlaceholder: 'Search Movies & TV',
});

const SearchInput = () => {
  const intl = useIntl();
  const { searchValue, setSearchValue, setIsOpen, clear } = useSearchInput();
  return (
    <div className="flex flex-1">
      <div className="flex w-full">
        <label htmlFor="search_field" className="sr-only">
          Search
        </label>
        <div className="relative flex w-full items-center text-white focus-within:text-tv-text">
          <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-tv-text-secondary">
            <MagnifyingGlassIcon className="h-5 w-5" />
          </div>
          <input
            id="search_field"
            style={{
              paddingRight: searchValue.length > 0 ? '1.75rem' : '',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
            className="block w-full rounded-full border border-tv-border bg-tv-surface/80 py-2.5 pl-10 text-tv-text placeholder-tv-text-tertiary transition-all duration-200 hover:border-tv-border-hover hover:bg-tv-surface focus:border-tv-accent focus:bg-tv-surface focus:placeholder-tv-text-secondary focus:outline-none focus:ring-2 focus:ring-tv-accent focus:ring-opacity-20 sm:text-base"
            placeholder={intl.formatMessage(messages.searchPlaceholder)}
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
                (e.target as HTMLInputElement).blur();
              }
            }}
          />
          {searchValue.length > 0 && (
            <button
              className="absolute inset-y-0 right-2 m-auto h-7 w-7 rounded-full border-none p-1 text-tv-text-secondary outline-none transition-all duration-200 hover:bg-tv-surface-light hover:text-tv-text focus:border-none focus:outline-none"
              onClick={() => clear()}
            >
              <XCircleIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchInput;
