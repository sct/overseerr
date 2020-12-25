import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import DiscordLogo from '../../assets/extlogos/discord_white.svg';
import SlackLogo from '../../assets/extlogos/slack.svg';

const messages = defineMessages({
  notificationsettings: 'Notification Settings',
  notificationsettingsDescription:
    'Here you can pick and choose what types of notifications to send and through what types of services.',
});

interface SettingsRoute {
  text: React.ReactNode;
  route: string;
  regex: RegExp;
}

const settingsRoutes: SettingsRoute[] = [
  {
    text: (
      <span className="flex items-center">
        <svg
          className="h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
          />
        </svg>
        Email
      </span>
    ),
    route: '/settings/notifications/email',
    regex: /^\/settings\/notifications\/email/,
  },
  {
    text: (
      <span className="flex items-center">
        <DiscordLogo className="h-4 mr-2" />
        Discord
      </span>
    ),
    route: '/settings/notifications/discord',
    regex: /^\/settings\/notifications\/discord/,
  },
  {
    text: (
      <span className="flex items-center">
        <SlackLogo className="h-4 mr-2" />
        Slack
      </span>
    ),
    route: '/settings/notifications/slack',
    regex: /^\/settings\/notifications\/slack/,
  },
];

const SettingsNotifications: React.FC = ({ children }) => {
  const router = useRouter();
  const intl = useIntl();

  const activeLinkColor = 'bg-indigo-700';

  const inactiveLinkColor = 'bg-gray-800';

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
            router.pathname.match(regex) ? activeLinkColor : inactiveLinkColor
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
      <div className="mb-6">
        <h3 className="text-lg font-medium leading-6 text-gray-200">
          {intl.formatMessage(messages.notificationsettings)}
        </h3>
        <p className="max-w-2xl mt-1 text-sm leading-5 text-gray-500">
          {intl.formatMessage(messages.notificationsettingsDescription)}
        </p>
      </div>
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
            className="block w-full py-2 pl-3 pr-10 mt-1 text-base leading-6 text-white transition duration-150 ease-in-out bg-gray-800 border-gray-700 rounded-md form-select focus:outline-none focus:ring-blue focus:border-blue-300 sm:text-sm sm:leading-5"
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
