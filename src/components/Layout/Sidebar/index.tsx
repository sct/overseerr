import Badge from '@app/components/Common/Badge';
import VersionStatus from '@app/components/Layout/VersionStatus';
import useClickOutside from '@app/hooks/useClickOutside';
import { Permission, useUser } from '@app/hooks/useUser';
import { Transition } from '@headlessui/react';
import {
  ClockIcon,
  CogIcon,
  ExclamationTriangleIcon,
  FilmIcon,
  MagnifyingGlassIcon,
  MusicalNoteIcon,
  SparklesIcon,
  TvIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Fragment, useEffect, useRef } from 'react';
import { defineMessages, useIntl } from 'react-intl';

export const menuMessages = defineMessages({
  dashboard: 'Discover',
  browsemovies: 'Movies',
  browsetv: 'Series',
  browsemusic: 'Music',
  searchmusic: 'Search Music',
  requests: 'Requests',
  issues: 'Issues',
  users: 'Users',
  settings: 'Settings',
});

interface SidebarProps {
  open?: boolean;
  setClosed: () => void;
  pendingRequestsCount: number;
  openIssuesCount: number;
  revalidateIssueCount: () => void;
  revalidateRequestsCount: () => void;
}

interface SidebarLinkProps {
  href: string;
  svgIcon: React.ReactNode;
  messagesKey: keyof typeof menuMessages;
  activeRegExp: RegExp;
  as?: string;
  requiredPermission?: Permission | Permission[];
  permissionType?: 'and' | 'or';
  dataTestId?: string;
}

const SidebarLinks: SidebarLinkProps[] = [
  {
    href: '/',
    messagesKey: 'dashboard',
    svgIcon: <SparklesIcon className="h-5 w-5" />,
    activeRegExp: /^\/(discover\/?)?$/,
  },
  {
    href: '/discover/movies',
    messagesKey: 'browsemovies',
    svgIcon: <FilmIcon className="h-5 w-5" />,
    activeRegExp: /^\/discover\/movies$/,
  },
  {
    href: '/discover/tv',
    messagesKey: 'browsetv',
    svgIcon: <TvIcon className="h-5 w-5" />,
    activeRegExp: /^\/discover\/tv$/,
  },
  {
    href: '/discover/music',
    messagesKey: 'browsemusic',
    svgIcon: <MusicalNoteIcon className="h-5 w-5" />,
    activeRegExp: /^\/discover\/music/,
  },
  {
    href: '/search?mediaType=artist',
    messagesKey: 'searchmusic',
    svgIcon: <MagnifyingGlassIcon className="h-5 w-5" />,
    activeRegExp: /^\/search/,
  },
  {
    href: '/requests',
    messagesKey: 'requests',
    svgIcon: <ClockIcon className="h-5 w-5" />,
    activeRegExp: /^\/requests/,
  },
  {
    href: '/issues',
    messagesKey: 'issues',
    svgIcon: <ExclamationTriangleIcon className="h-5 w-5" />,
    activeRegExp: /^\/issues/,
    requiredPermission: [
      Permission.MANAGE_ISSUES,
      Permission.CREATE_ISSUES,
      Permission.VIEW_ISSUES,
    ],
    permissionType: 'or',
  },
  {
    href: '/users',
    messagesKey: 'users',
    svgIcon: <UsersIcon className="h-5 w-5" />,
    activeRegExp: /^\/users/,
    requiredPermission: Permission.MANAGE_USERS,
    dataTestId: 'sidebar-menu-users',
  },
  {
    href: '/settings',
    messagesKey: 'settings',
    svgIcon: <CogIcon className="h-5 w-5" />,
    activeRegExp: /^\/settings/,
    requiredPermission: Permission.ADMIN,
    dataTestId: 'sidebar-menu-settings',
  },
];

const Sidebar = ({
  open,
  setClosed,
  pendingRequestsCount,
  openIssuesCount,
  revalidateIssueCount,
  revalidateRequestsCount,
}: SidebarProps) => {
  const navRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const intl = useIntl();
  const { hasPermission } = useUser();
  useClickOutside(navRef, () => setClosed());

  useEffect(() => {
    if (openIssuesCount) {
      revalidateIssueCount();
    }

    if (pendingRequestsCount) {
      revalidateRequestsCount();
    }
  }, [
    revalidateIssueCount,
    revalidateRequestsCount,
    pendingRequestsCount,
    openIssuesCount,
  ]);

  return (
    <>
      <div className="lg:hidden">
        <Transition as={Fragment} show={open}>
          <div className="fixed inset-0 z-40 flex">
            <Transition.Child
              as="div"
              enter="transition-opacity ease-linear duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-linear duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0">
                <div className="absolute inset-0 bg-gray-900 opacity-90"></div>
              </div>
            </Transition.Child>
            <Transition.Child
              as="div"
              enter="transition-transform ease-in-out duration-300"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition-transform ease-in-out duration-300"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <>
                <div className="sidebar relative flex h-full w-full max-w-xs flex-1 flex-col bg-gray-800">
                  <div className="sidebar-close-button absolute right-0 -mr-14 p-1">
                    <button
                      className="flex h-12 w-12 items-center justify-center rounded-full focus:bg-gray-600 focus:outline-none"
                      aria-label="Close sidebar"
                      onClick={() => setClosed()}
                    >
                      <XMarkIcon className="h-6 w-6 text-white" />
                    </button>
                  </div>
                  <div
                    ref={navRef}
                    className="flex flex-1 flex-col overflow-y-auto pt-8 pb-8 sm:pb-4"
                  >
                    <div className="flex flex-shrink-0 items-center px-2">
                      <span className="px-4 text-xl text-gray-50">
                        <a href="/">
                          <img src="/logo_full.svg" alt="Logo" />
                        </a>
                      </span>
                    </div>
                    <nav className="mt-16 flex-1 space-y-4 px-4">
                      {SidebarLinks.filter((link) =>
                        link.requiredPermission
                          ? hasPermission(link.requiredPermission, {
                              type: link.permissionType ?? 'and',
                            })
                          : true
                      ).map((sidebarLink) => {
                        return (
                          <Link
                            key={`mobile-${sidebarLink.messagesKey}`}
                            href={sidebarLink.href}
                            as={sidebarLink.as}
                            legacyBehavior
                          >
                            <a
                              onClick={() => setClosed()}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  setClosed();
                                }
                              }}
                              role="button"
                              tabIndex={0}
                              className={`flex items-center rounded-lg px-3 py-3 text-base font-medium leading-6 text-white transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500
                                ${
                                  router.pathname.match(
                                    sidebarLink.activeRegExp
                                  )
                                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg'
                                    : 'hover:bg-gray-700/80'
                                }
                              `}
                              data-testid={`${sidebarLink.dataTestId}-mobile`}
                            >
                              <span
                                className={`mr-3 flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                                  router.pathname.match(
                                    sidebarLink.activeRegExp
                                  )
                                    ? 'bg-white/10'
                                    : 'bg-gray-700/50'
                                }`}
                              >
                                {sidebarLink.svgIcon}
                              </span>
                              {intl.formatMessage(
                                menuMessages[sidebarLink.messagesKey]
                              )}
                            </a>
                          </Link>
                        );
                      })}
                    </nav>
                    {hasPermission(Permission.ADMIN) && (
                      <div className="px-2">
                        <VersionStatus onClick={() => setClosed()} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-14 flex-shrink-0">
                  {/* <!-- Force sidebar to shrink to fit close icon --> */}
                </div>
              </>
            </Transition.Child>
          </div>
        </Transition>
      </div>

      <div className="fixed top-0 bottom-0 left-0 z-30 hidden lg:flex lg:flex-shrink-0">
        <div className="sidebar flex w-64 flex-col">
          <div className="flex h-0 flex-1 flex-col">
            <div className="flex flex-1 flex-col overflow-y-auto pt-8 pb-4">
              <div className="flex flex-shrink-0 items-center">
                <span className="px-4 text-2xl text-gray-50">
                  <a href="/">
                    <img src="/logo_full.svg" alt="Logo" />
                  </a>
                </span>
              </div>
              <nav className="mt-16 flex-1 space-y-4 px-4">
                {SidebarLinks.filter((link) =>
                  link.requiredPermission
                    ? hasPermission(link.requiredPermission, {
                        type: link.permissionType ?? 'and',
                      })
                    : true
                ).map((sidebarLink) => {
                  return (
                    <Link
                      key={`desktop-${sidebarLink.messagesKey}`}
                      href={sidebarLink.href}
                      as={sidebarLink.as}
                      legacyBehavior
                    >
                      <a
                        className={`group relative flex items-center rounded-lg px-3 py-2.5 text-base font-medium leading-6 text-white transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800
                                ${
                                  router.pathname.match(
                                    sidebarLink.activeRegExp
                                  )
                                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-900/50 hover:from-indigo-500 hover:to-purple-500'
                                    : 'hover:bg-gray-700/80 hover:shadow-md hover:shadow-gray-900/20'
                                }
                              `}
                        data-testid={sidebarLink.dataTestId}
                      >
                        <span
                          className={`mr-3 flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                            router.pathname.match(sidebarLink.activeRegExp)
                              ? 'bg-white/10'
                              : 'bg-gray-700/50 group-hover:bg-gray-600/50'
                          }`}
                        >
                          {sidebarLink.svgIcon}
                        </span>
                        {intl.formatMessage(
                          menuMessages[sidebarLink.messagesKey]
                        )}
                        {sidebarLink.messagesKey === 'requests' &&
                          pendingRequestsCount > 0 &&
                          hasPermission(Permission.MANAGE_REQUESTS) && (
                            <div className="ml-auto flex">
                              <Badge
                                className={`rounded-md bg-gradient-to-br ${
                                  router.pathname.match(
                                    sidebarLink.activeRegExp
                                  )
                                    ? 'border-indigo-600 from-indigo-700 to-purple-700'
                                    : 'border-indigo-500 from-indigo-600 to-purple-600'
                                }`}
                              >
                                {pendingRequestsCount}
                              </Badge>
                            </div>
                          )}
                        {sidebarLink.messagesKey === 'issues' &&
                          openIssuesCount > 0 &&
                          hasPermission(Permission.MANAGE_ISSUES) && (
                            <div className="ml-auto flex">
                              <Badge
                                className={`rounded-md bg-gradient-to-br ${
                                  router.pathname.match(
                                    sidebarLink.activeRegExp
                                  )
                                    ? 'border-indigo-600 from-indigo-700 to-purple-700'
                                    : 'border-indigo-500 from-indigo-600 to-purple-600'
                                }`}
                              >
                                {openIssuesCount}
                              </Badge>
                            </div>
                          )}
                      </a>
                    </Link>
                  );
                })}
              </nav>
              {hasPermission(Permission.ADMIN) && (
                <div className="px-2">
                  <VersionStatus />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
