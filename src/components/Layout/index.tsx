import React, { useState } from 'react';
import SearchInput from './SearchInput';
import UserDropdown from './UserDropdown';
import Sidebar from './Sidebar';
import LanguagePicker from './LanguagePicker';
import { useRouter } from 'next/router';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Permission, useUser } from '../../hooks/useUser';

const messages = defineMessages({
  alphawarning:
    'This is ALPHA software. Almost everything is bound to be nearly broken and/or unstable. Please report issues to the Overseerr Github!',
});

const Layout: React.FC = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { hasPermission } = useUser();
  const router = useRouter();

  return (
    <div className="min-h-full h-full flex bg-gray-900">
      <Sidebar open={isSidebarOpen} setClosed={() => setSidebarOpen(false)} />

      <div className="flex flex-col w-0 flex-1 md:ml-64 relative mb-16">
        <div className="z-10 flex-shrink-0 flex h-16 bg-gray-600 shadow fixed right-0 left-0 md:left-64">
          <button
            className="px-4 border-r border-gray-800 text-gray-200 focus:outline-none focus:bg-gray-300 focus:text-gray-600 md:hidden"
            aria-label="Open sidebar"
            onClick={() => setSidebarOpen(true)}
          >
            <svg
              className="h-6 w-6"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h7"
              />
            </svg>
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <SearchInput />
            <div className="ml-4 flex items-center md:ml-6">
              <LanguagePicker />
              <UserDropdown />
            </div>
          </div>
        </div>

        <main
          className="relative z-0 top-16 focus:outline-none right-0"
          tabIndex={0}
        >
          <div className="pt-2 pb-6 md:py-6">
            <div className="max-w-8xl mx-auto px-4 sm:px-6 md:px-8">
              {router.pathname === '/' && hasPermission(Permission.ADMIN) && (
                <div className="rounded-md bg-indigo-700 p-4 mt-2">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1 md:flex md:justify-between">
                      <p className="text-sm leading-5 text-white">
                        <FormattedMessage {...messages.alphawarning} />
                      </p>
                      <p className="mt-3 text-sm leading-5 md:mt-0 md:ml-6">
                        <a
                          href="http://github.com/sct/overseerr"
                          className="whitespace-nowrap font-medium text-indigo-100 hover:text-white transition ease-in-out duration-150"
                          target="_blank"
                          rel="noreferrer"
                        >
                          GitHub &rarr;
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
