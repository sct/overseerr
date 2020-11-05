import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface SettingsRoute {
  text: string;
  route: string;
  regex: RegExp;
}

const settingsRoutes: SettingsRoute[] = [
  {
    text: 'General Settings',
    route: '/settings/main',
    regex: /^\/settings(\/main)?$/,
  },
  {
    text: 'Plex',
    route: '/settings/plex',
    regex: /^\/settings\/plex/,
  },
  {
    text: 'Services',
    route: '/settings/services',
    regex: /^\/settings\/services/,
  },
  {
    text: 'Logs',
    route: '/settings/logs',
    regex: /^\/settings\/logs/,
  },
  {
    text: 'Jobs',
    route: '/settings/jobs',
    regex: /^\/settings\/jobs/,
  },
  {
    text: 'About',
    route: '/settings/about',
    regex: /^\/settings\/about/,
  },
];

const SettingsLayout: React.FC = ({ children }) => {
  const router = useRouter();
  const activeLinkColor =
    'border-indigo-600 text-indigo-500 focus:outline-none focus:text-indigo-500 focus:border-indigo-500';

  const inactiveLinkColor =
    'border-transparent text-cool-gray-500 hover:text-cool-gray-400 hover:border-cool-gray-300 focus:outline-none focus:text-cool-gray-4700 focus:border-cool-gray-300';

  const SettingsLink: React.FC<{
    route: string;
    regex: RegExp;
    isMobile?: boolean;
  }> = ({ children, route, regex, isMobile = false }) => {
    if (isMobile) {
      return <option value={route}>{children}</option>;
    }

    return (
      <Link href={route}>
        <a
          className={`whitespace-no-wrap ml-8 first:ml-0 py-4 px-1 border-b-2 border-transparent font-medium text-sm leading-5 ${
            !!router.pathname.match(regex) ? activeLinkColor : inactiveLinkColor
          }`}
          aria-current="page"
        >
          {children}
        </a>
      </Link>
    );
  };
  return (
    <>
      <div className="mt-6">
        <div className="sm:hidden">
          <select
            onChange={(e) => {
              router.push(e.target.value);
            }}
            onBlur={(e) => {
              router.push(e.target.value);
            }}
            defaultValue={
              settingsRoutes.find(
                (route) => !!router.pathname.match(route.regex)
              )?.route
            }
            aria-label="Selected tab"
            className="bg-cool-gray-800 text-white mt-1 form-select block w-full pl-3 pr-10 py-2 text-base leading-6 border-cool-gray-700 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 sm:text-sm sm:leading-5 transition ease-in-out duration-150"
          >
            {settingsRoutes.map((route, index) => (
              <SettingsLink
                route={route.route}
                regex={route.regex}
                isMobile
                key={`mobile-settings-link-${index}`}
              >
                {route.text}
              </SettingsLink>
            ))}
          </select>
        </div>
        <div className="hidden sm:block">
          <div className="border-b border-cool-gray-600">
            <nav className="-mb-px flex">
              {settingsRoutes.map((route, index) => (
                <SettingsLink
                  route={route.route}
                  regex={route.regex}
                  key={`standard-settings-link-${index}`}
                >
                  {route.text}
                </SettingsLink>
              ))}
            </nav>
          </div>
        </div>
      </div>
      <div className="mt-10 text-white">{children}</div>
    </>
  );
};

export default SettingsLayout;
