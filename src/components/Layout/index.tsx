import React, { useState } from 'react';
import SearchInput from './SearchInput';
import UserDropdown from './UserDropdown';
import Sidebar from './Sidebar';
import Notifications from './Notifications';

const Layout: React.FC = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-full h-full flex bg-cool-gray-900">
      <Sidebar open={isSidebarOpen} setClosed={() => setSidebarOpen(false)} />

      <div className="flex flex-col w-0 flex-1 md:ml-64 relative mb-16">
        <div className="z-10 flex-shrink-0 flex h-16 bg-cool-gray-600 shadow fixed right-0 left-0 md:left-64">
          <button
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:bg-gray-100 focus:text-gray-600 md:hidden"
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
              <Notifications />
              <UserDropdown />
            </div>
          </div>
        </div>

        <main
          className="relative z-0 top-16 focus:outline-none right-0"
          tabIndex={0}
        >
          <div className="pt-2 pb-6 md:py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
