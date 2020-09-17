import React, { ReactNode } from 'react';
import Transition from '../../Transition';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface SidebarProps {
  open?: boolean;
  setClosed: () => void;
}

interface SidebarLinkProps {
  href: string;
  svgIcon: ReactNode;
  name: string;
  activeRegExp: RegExp;
  as?: string;
}

const SidebarLinks: SidebarLinkProps[] = [
  {
    href: '/',
    name: 'Dashboard',
    svgIcon: (
      <svg
        className="mr-3 h-6 w-6 text-gray-300 group-hover:text-gray-300 group-focus:text-gray-300 transition ease-in-out duration-150"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
        />
      </svg>
    ),
    activeRegExp: /^\/(discover\/?(movies|tv)?)?$/,
  },
  {
    href: '/requests',
    name: 'Requests',
    svgIcon: (
      <svg
        className="mr-3 h-6 w-6 text-gray-300 group-hover:text-gray-300 group-focus:text-gray-300 transition ease-in-out duration-150"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    activeRegExp: /^\/requests/,
  },
  {
    href: '/settings',
    name: 'Settings',
    svgIcon: (
      <svg
        className="mr-3 h-6 w-6 text-gray-300 group-hover:text-gray-300 group-focus:text-gray-300 transition ease-in-out duration-150"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
    activeRegExp: /^\/settings/,
  },
];

const Sidebar: React.FC<SidebarProps> = ({ open, setClosed }) => {
  const router = useRouter();
  return (
    <>
      <div className="md:hidden">
        <Transition show={open}>
          <div className="fixed inset-0 flex z-40">
            <Transition
              enter="transition-opacity ease-linear duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-linear duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0">
                <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
              </div>
            </Transition>
            <Transition
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <>
                <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gray-800">
                  <div className="absolute top-0 right-0 -mr-14 p-1">
                    <button
                      className="flex items-center justify-center h-12 w-12 rounded-full focus:outline-none focus:bg-gray-600"
                      aria-label="Close sidebar"
                      onClick={() => setClosed()}
                    >
                      <svg
                        className="h-6 w-6 text-white"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                    <div className="flex-shrink-0 flex items-center px-4">
                      <span className="text-xl text-cool-gray-50">
                        Overseerr
                      </span>
                    </div>
                    <nav className="mt-5 px-2 space-y-1">
                      {SidebarLinks.map((sidebarLink) => {
                        return (
                          <Link
                            key={`mobile-${sidebarLink.name}`}
                            href={sidebarLink.href}
                            as={sidebarLink.as}
                          >
                            <a
                              className={`group flex items-center px-2 py-2 text-base leading-6 font-medium rounded-md text-white focus:outline-none focus:bg-gray-700 transition ease-in-out duration-150
                                ${
                                  router.pathname.match(
                                    sidebarLink.activeRegExp
                                  )
                                    ? 'bg-gray-900'
                                    : ''
                                }
                              `}
                            >
                              {sidebarLink.svgIcon}
                              {sidebarLink.name}
                            </a>
                          </Link>
                        );
                      })}
                    </nav>
                  </div>
                </div>
                <div className="flex-shrink-0 w-14">
                  {/* <!-- Force sidebar to shrink to fit close icon --> */}
                </div>
              </>
            </Transition>
          </div>
        </Transition>
      </div>

      <div className="hidden md:flex md:flex-shrink-0 top-0 bottom-0 left-0 fixed">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-gray-800">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <span className="text-2xl text-cool-gray-50">Overseerr</span>
              </div>
              <nav className="mt-5 flex-1 px-2 bg-gray-800 space-y-1">
                {SidebarLinks.map((sidebarLink) => {
                  return (
                    <Link
                      key={`desktop-${sidebarLink.name}`}
                      href={sidebarLink.href}
                      as={sidebarLink.as}
                    >
                      <a
                        className={`group flex items-center px-2 py-2 text-base leading-6 font-medium rounded-md text-white focus:outline-none focus:bg-gray-700 transition ease-in-out duration-150
                                ${
                                  router.pathname.match(
                                    sidebarLink.activeRegExp
                                  )
                                    ? 'bg-gray-900'
                                    : ''
                                }
                              `}
                      >
                        {sidebarLink.svgIcon}
                        {sidebarLink.name}
                      </a>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
