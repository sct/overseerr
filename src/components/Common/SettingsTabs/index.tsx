import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import { hasPermission, Permission } from '../../../../server/lib/permissions';
import { useUser } from '../../../hooks/useUser';

export interface SettingsRoute {
  text: string;
  content?: React.ReactNode;
  route: string;
  regex: RegExp;
  requiredPermission?: Permission | Permission[];
  permissionType?: { type: 'and' | 'or' };
  hidden?: boolean;
}

const SettingsLink: React.FC<{
  tabType: 'default' | 'button';
  currentPath: string;
  route: string;
  regex: RegExp;
  hidden?: boolean;
  isMobile?: boolean;
}> = ({
  children,
  tabType,
  currentPath,
  route,
  regex,
  hidden = false,
  isMobile = false,
}) => {
  if (hidden) {
    return null;
  }

  if (isMobile) {
    return <option value={route}>{children}</option>;
  }

  let linkClasses =
    'whitespace-nowrap ml-8 first:ml-0 py-4 px-1 border-b-2 border-transparent font-medium text-sm leading-5';
  let activeLinkColor =
    'border-indigo-600 text-indigo-500 focus:outline-none focus:text-indigo-500 focus:border-indigo-500';
  let inactiveLinkColor =
    'border-transparent text-gray-500 hover:text-gray-400 hover:border-gray-300 focus:outline-none focus:text-gray-4700 focus:border-gray-300';

  if (tabType === 'button') {
    linkClasses =
      'whitespace-nowrap ml-8 first:ml-0 px-3 py-2 font-medium text-sm rounded-md';
    activeLinkColor = 'bg-indigo-700';
    inactiveLinkColor = 'bg-gray-800';
  }

  return (
    <Link href={route}>
      <a
        className={`${linkClasses} ${
          currentPath.match(regex) ? activeLinkColor : inactiveLinkColor
        }`}
        aria-current="page"
      >
        {children}
      </a>
    </Link>
  );
};

const SettingsTabs: React.FC<{
  tabType?: 'default' | 'button';
  settingsRoutes: SettingsRoute[];
  defaultValue?: string;
}> = ({ tabType = 'default', settingsRoutes, defaultValue }) => {
  const router = useRouter();
  const { user: currentUser } = useUser();

  return (
    <>
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">
          Select a Tab
        </label>
        <select
          onChange={(e) => {
            router.push(e.target.value);
          }}
          onBlur={(e) => {
            router.push(e.target.value);
          }}
          defaultValue={
            defaultValue ??
            settingsRoutes.find((route) => !!router.pathname.match(route.regex))
              ?.route
          }
          aria-label="Selected Tab"
        >
          {settingsRoutes
            .filter(
              (route) =>
                !route.hidden &&
                (route.requiredPermission
                  ? hasPermission(
                      route.requiredPermission,
                      currentUser?.permissions ?? 0,
                      route.permissionType
                    )
                  : true)
            )
            .map((route, index) => (
              <SettingsLink
                tabType={tabType}
                currentPath={router.pathname}
                route={route.route}
                regex={route.regex}
                hidden={route.hidden ?? false}
                isMobile
                key={`mobile-settings-link-${index}`}
              >
                {route.text}
                {router.pathname}
              </SettingsLink>
            ))}
        </select>
      </div>
      {tabType === 'button' ? (
        <div className="hidden overflow-x-scroll overflow-y-hidden sm:block hide-scrollbar">
          <nav className="flex space-x-4" aria-label="Tabs">
            {settingsRoutes.map((route, index) => (
              <SettingsLink
                tabType={tabType}
                currentPath={router.pathname}
                route={route.route}
                regex={route.regex}
                hidden={route.hidden ?? false}
                key={`standard-settings-link-${index}`}
              >
                {route.content ?? route.text}
              </SettingsLink>
            ))}
          </nav>
        </div>
      ) : (
        <div className="hidden sm:block">
          <div className="border-b border-gray-600">
            <nav className="flex -mb-px">
              {settingsRoutes
                .filter(
                  (route) =>
                    !route.hidden &&
                    (route.requiredPermission
                      ? hasPermission(
                          route.requiredPermission,
                          currentUser?.permissions ?? 0,
                          route.permissionType
                        )
                      : true)
                )
                .map((route, index) => (
                  <SettingsLink
                    tabType={tabType}
                    currentPath={router.pathname}
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
      )}
    </>
  );
};

export default SettingsTabs;
