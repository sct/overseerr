import React from 'react';
import PlexLoginButton from '../PlexLoginButton';

const Setup: React.FC = () => {
  return (
    <div className="w-full pt-10">
      <nav>
        <ul className="border border-gray-300 rounded-md divide-y divide-gray-300 md:flex md:divide-y-0">
          <li className="relative md:flex-1 md:flex">
            {/* <!-- Completed Step --> */}

            <div className="px-6 py-4 flex items-center text-sm leading-5 font-medium space-x-4">
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center border-2 border-indigo-600 rounded-full">
                <p className="text-indigo-600">01</p>
              </div>
              <p className="text-sm leading-5 font-medium text-indigo-600">
                Login with Plex
              </p>
            </div>

            <div className="hidden md:block absolute top-0 right-0 h-full w-5">
              <svg
                className="h-full w-full text-gray-300"
                viewBox="0 0 22 80"
                fill="none"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 -2L20 40L0 82"
                  vectorEffect="non-scaling-stroke"
                  stroke="currentcolor"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </li>

          <li className="relative md:flex-1 md:flex">
            {/* <!-- Completed Step --> */}

            <a href="#" className="group flex items-center">
              <div className="px-6 py-4 flex items-center text-sm leading-5 font-medium space-x-4">
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center border-2 border-gray-300 rounded-full group-hover:border-gray-400 transition ease-in-out duration-150">
                  <span className="text-gray-500 group-hover:text-gray-900 transition ease-in-out duration-150">
                    02
                  </span>
                </div>
                <p className="text-sm leading-5 font-medium text-gray-500 group-hover:text-gray-900 transition ease-in-out duration-150">
                  Configure Plex
                </p>
              </div>
              <div className="hidden md:block absolute top-0 right-0 h-full w-5">
                <svg
                  className="h-full w-full text-gray-300"
                  viewBox="0 0 22 80"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 -2L20 40L0 82"
                    vectorEffect="non-scaling-stroke"
                    stroke="currentcolor"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </a>
          </li>

          <li className="relative md:flex-1 md:flex">
            {/* <!-- Completed Step --> */}

            <a href="#" className="group flex items-center">
              <div className="px-6 py-4 flex items-center text-sm leading-5 font-medium space-x-4">
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center border-2 border-gray-300 rounded-full group-hover:border-gray-400 transition ease-in-out duration-150">
                  <span className="text-gray-500 group-hover:text-gray-900 transition ease-in-out duration-150">
                    03
                  </span>
                </div>
                <p className="text-sm leading-5 font-medium text-gray-500 group-hover:text-gray-900 transition ease-in-out duration-150">
                  Configure Radarr and Sonarr
                </p>
              </div>
            </a>
          </li>
        </ul>
      </nav>
      <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="flex justify-center text-gray-900 font-bold text-xl mb-2">
          Welcome to Overseerr
        </div>
        <div className="flex justify-center text-gray-900 text-sm pb-6 mb-2">
          Get started by logging in with your Plex account
        </div>
        <div className="flex items-center justify-center">
          <PlexLoginButton
            onAuthToken={(authToken) =>
              console.log(`auth token is: ${authToken}`)
            }
          />
        </div>
      </form>
    </div>
  );
};

export default Setup;

//current issues: onclick it fills it in gray for whatever reason. maybe dont want it to do anything when clicking? or maybe prevturn to previous steps only?
