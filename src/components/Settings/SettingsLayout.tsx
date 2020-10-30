import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const SettingsLayout: React.FC = ({ children }) => {
  const router = useRouter();
  const activeLinkColor =
    'border-indigo-600 text-indigo-500 focus:outline-none focus:text-indigo-500 focus:border-indigo-500';

  const inactiveLinkColor =
    'border-transparent text-cool-gray-500 hover:text-cool-gray-400 hover:border-cool-gray-300 focus:outline-none focus:text-cool-gray-4700 focus:border-cool-gray-300';

  const settingsLink = ({
    text,
    route,
    regex,
  }: {
    text: string;
    route: string;
    regex: RegExp;
  }) => {
    return (
      <Link href={route}>
        <a
          className={`whitespace-no-wrap pb-4 px-1 border-b-2 font-medium text-sm leading-5 ${
            !!router.pathname.match(regex) ? activeLinkColor : inactiveLinkColor
          }`}
          aria-current="page"
        >
          {text}
        </a>
      </Link>
    );
  };
  return (
    <>
      <div className="border-b border-cool-gray-600 mt-10">
        <div className="space-y-4 sm:flex sm:items-baseline sm:space-y-0 sm:space-x-10">
          <h3 className="text-lg leading-6 font-medium text-white">Settings</h3>
          <div>
            <nav className="-mb-px flex space-x-8">
              {settingsLink({
                text: 'General Settings',
                route: '/settings/main',
                regex: /^\/settings(\/main)?$/,
              })}
              {settingsLink({
                text: 'Plex Settings',
                route: '/settings/plex',
                regex: /^\/settings\/plex/,
              })}
              {settingsLink({
                text: 'Services',
                route: '/settings/services',
                regex: /^\/settings\/services/,
              })}
            </nav>
          </div>
        </div>
      </div>
      <div className="mt-10 text-white">{children}</div>
    </>
  );
};

export default SettingsLayout;
