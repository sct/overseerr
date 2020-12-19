import React from 'react';
import useSearchInput from '../../../hooks/useSearchInput';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  searchPlaceholder: 'Search Movies & TV',
});

const SearchInput: React.FC = () => {
  const intl = useIntl();
  const { searchValue, setSearchValue, setIsOpen } = useSearchInput();
  return (
    <div className="flex-1 flex">
      <div className="w-full flex md:ml-0">
        <label htmlFor="search_field" className="sr-only">
          Search
        </label>
        <div className="relative w-full text-white focus-within:text-gray-200">
          <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              />
            </svg>
          </div>
          <input
            id="search_field"
            className="block w-full h-full pl-8 pr-1 py-2 rounded-md border-transparent focus:border-transparent bg-gray-600 text-white placeholder-gray-300 focus:outline-none focus:ring-0 focus:placeholder-gray-400 sm:text-base"
            placeholder={intl.formatMessage(messages.searchPlaceholder)}
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setIsOpen(false)}
          />
        </div>
      </div>
    </div>
  );
};

export default SearchInput;
