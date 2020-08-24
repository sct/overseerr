import React, { useState } from 'react';
import Search from '../Search';
import UserDropdown from './UserDropdown';
import Sidebar from './Sidebar';
import Notifications from './Notifications';

const Layout: React.FC = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      <Sidebar open={isSidebarOpen} setClosed={() => setSidebarOpen(false)} />

      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
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
            <Search />
            <div className="ml-4 flex items-center md:ml-6">
              <Notifications />
              <UserDropdown />
            </div>
          </div>
        </div>

        <main
          className="flex-1 relative z-0 overflow-y-auto focus:outline-none"
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
