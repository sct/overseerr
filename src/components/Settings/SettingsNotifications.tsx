import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';

interface SettingsRoute {
  text: string;
  route: string;
  regex: RegExp;
}

const settingsRoutes: SettingsRoute[] = [
  {
    text: 'General',
    route: '/settings/notifications',
    regex: /^\/settings\/notifications$/,
  },
  {
    text: 'Discord',
    route: '/settings/notifications/discord',
    regex: /^\/settings\/notifications\/discord/,
  },
];

const SettingsNotifications: React.FC = ({ children }) => {
  const router = useRouter();

  const activeLinkColor = 'bg-gray-700';

  const inactiveLinkColor = '';

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
          className={`whitespace-nowrap ml-8 first:ml-0 px-3 py-2 font-medium text-sm rounded-md ${
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
      <div>
        <div className="sm:hidden">
          <label htmlFor="tabs" className="sr-only">
            Select a tab
          </label>
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
            className="bg-gray-800 text-white mt-1 rounded-md form-select block w-full pl-3 pr-10 py-2 text-base leading-6 border-gray-700 focus:outline-none focus:ring-blue focus:border-blue-300 sm:text-sm sm:leading-5 transition ease-in-out duration-150"
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
          <nav className="flex space-x-4" aria-label="Tabs">
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
      <div className="mt-10">{children}</div>
    </>
  );
};

export default SettingsNotifications;
