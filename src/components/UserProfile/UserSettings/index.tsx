import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useUser } from '../../../hooks/useUser';
import Error from '../../../pages/_error';
import LoadingSpinner from '../../Common/LoadingSpinner';
import PageTitle from '../../Common/PageTitle';
import ProfileHeader from '../ProfileHeader';

const messages = defineMessages({
  settings: 'User Settings',
  menuGeneralSettings: 'General Settings',
  menuChangePass: 'Change Password',
  menuNotifications: 'Notifications',
});

interface SettingsRoute {
  text: string;
  route: string;
  regex: RegExp;
}

const UserSettings: React.FC = ({ children }) => {
  const router = useRouter();
  const { user, error } = useUser({ id: Number(router.query.userId) });
  const intl = useIntl();

  if (!user && !error) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Error statusCode={500} />;
  }

  const settingsRoutes: SettingsRoute[] = [
    {
      text: intl.formatMessage(messages.menuGeneralSettings),
      route: '/profile/settings/main',
      regex: /^\/profile\/settings(\/main)?$/,
    },
    {
      text: intl.formatMessage(messages.menuChangePass),
      route: '/profile/settings/password',
      regex: /^\/profile\/settings\/password/,
    },
    {
      text: intl.formatMessage(messages.menuNotifications),
      route: '/profile/settings/notifications',
      regex: /^\/profile\/settings\/notifications/,
    },
  ];

  const activeLinkColor =
    'border-indigo-600 text-indigo-500 focus:outline-none focus:text-indigo-500 focus:border-indigo-500';

  const inactiveLinkColor =
    'border-transparent text-gray-500 hover:text-gray-400 hover:border-gray-300 focus:outline-none focus:text-gray-4700 focus:border-gray-300';

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
          className={`whitespace-nowrap ml-8 first:ml-0 py-4 px-1 border-b-2 border-transparent font-medium text-sm leading-5 ${
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
      <PageTitle title={intl.formatMessage(messages.settings)} />
      <ProfileHeader user={user} />
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
          <div className="border-b border-gray-600">
            <nav className="flex -mb-px">
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

export default UserSettings;
