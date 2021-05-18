import { MenuAlt2Icon } from '@heroicons/react/outline';
import { ArrowLeftIcon, InformationCircleIcon } from '@heroicons/react/solid';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { AvailableLocale } from '../../context/LanguageContext';
import useLocale from '../../hooks/useLocale';
import useSettings from '../../hooks/useSettings';
import { Permission, useUser } from '../../hooks/useUser';
import SearchInput from './SearchInput';
import Sidebar from './Sidebar';
import UserDropdown from './UserDropdown';

const messages = defineMessages({
  betawarning:
    'This is BETA software. Features may be broken and/or unstable. Please report any issues on GitHub!',
});

const Layout: React.FC = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, hasPermission } = useUser();
  const router = useRouter();
  const intl = useIntl();
  const { currentSettings } = useSettings();
  const { setLocale } = useLocale();

  useEffect(() => {
    if (setLocale && user) {
      setLocale(
        (user?.settings?.locale
          ? user.settings.locale
          : currentSettings.locale) as AvailableLocale
      );
    }
  }, [setLocale, currentSettings.locale, user]);

  useEffect(() => {
    const updateScrolled = () => {
      if (window.pageYOffset > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', updateScrolled, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateScrolled);
    };
  }, []);

  return (
    <div className="flex h-full min-w-0 min-h-full bg-gray-900">
      <div className="absolute top-0 w-full h-64 from-gray-800 to-gray-900 bg-gradient-to-bl">
        <div className="relative inset-0 w-full h-full from-gray-900 to-transparent bg-gradient-to-t" />
      </div>
      <Sidebar open={isSidebarOpen} setClosed={() => setSidebarOpen(false)} />

      <div className="relative flex flex-col flex-1 w-0 min-w-0 mb-16 md:ml-64">
        <div
          className={`searchbar fixed left-0 right-0 top-0 z-10 flex flex-shrink-0 bg-opacity-80 transition duration-300 ${
            isScrolled ? 'bg-gray-700' : 'bg-transparent'
          } md:left-64`}
          style={{
            backdropFilter: isScrolled ? 'blur(5px)' : undefined,
            WebkitBackdropFilter: isScrolled ? 'blur(5px)' : undefined,
          }}
        >
          <button
            className={`px-4 ${
              isScrolled ? 'text-gray-200' : 'text-gray-400'
            } focus:outline-none md:hidden transition duration-300`}
            aria-label="Open sidebar"
            onClick={() => setSidebarOpen(true)}
          >
            <MenuAlt2Icon className="w-6 h-6" />
          </button>
          <div className="flex items-center justify-between flex-1 pr-4 md:pr-4 md:pl-4">
            <button
              className={`mr-2 ${
                isScrolled ? 'text-gray-200' : 'text-gray-400'
              } transition duration-300 hover:text-white pwa-only focus:outline-none focus:text-white`}
              onClick={() => router.back()}
            >
              <ArrowLeftIcon className="w-7" />
            </button>
            <SearchInput />
            <div className="flex items-center ml-2">
              <UserDropdown />
            </div>
          </div>
        </div>

        <main className="relative z-0 top-16 focus:outline-none" tabIndex={0}>
          <div className="mb-6">
            <div className="px-4 mx-auto max-w-8xl">
              {router.pathname === '/' && hasPermission(Permission.ADMIN) && (
                <div className="p-4 mt-6 bg-indigo-700 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <InformationCircleIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 ml-3 md:flex md:justify-between">
                      <p className="text-sm leading-5 text-white">
                        {intl.formatMessage(messages.betawarning)}
                      </p>
                      <p className="mt-3 text-sm leading-5 md:mt-0 md:ml-6">
                        <a
                          href="http://github.com/sct/overseerr"
                          className="font-medium text-indigo-100 transition duration-150 ease-in-out whitespace-nowrap hover:text-white"
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
