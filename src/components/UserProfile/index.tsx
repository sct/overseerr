import React from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import LoadingSpinner from '../Common/LoadingSpinner';
import type { User } from '../../../server/entity/User';

const UserProfile: React.FC = () => {
  const router = useRouter();
  const { data, error } = useSWR<User>(`/api/v1/user/${router.query.userId}`);

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  return (
    <div className="py-6 px-4 space-y-6 sm:p-6 lg:pb-8">
      <div className="md:flex md:items-center md:justify-between mt-8 mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-cool-gray-100 sm:text-3xl sm:leading-9 sm:truncate">
            User Profile
          </h2>
        </div>
      </div>

      <div className="flex flex-col space-y-6 lg:flex-row lg:space-y-0 lg:space-x-6 text-white">
        <div className="flex-grow space-y-6">
          <div className="space-y-1">
            <label
              htmlFor="username"
              className="block text-sm font-medium leading-5 text-cool-gray-400"
            >
              Username
            </label>
            <div className="rounded-md shadow-sm flex">
              <input
                id="username"
                className="form-input flex-grow block w-full min-w-0 rounded-md transition duration-150 ease-in-out sm:text-sm sm:leading-5 bg-cool-gray-700 border border-cool-gray-500"
                value={data?.username}
                readOnly
              />
            </div>
          </div>
          <div className="space-y-1">
            <label
              htmlFor="email"
              className="block text-sm font-medium leading-5 text-cool-gray-400"
            >
              Email
            </label>
            <div className="rounded-md shadow-sm flex">
              <input
                id="email"
                className="form-input flex-grow block w-full min-w-0 rounded-md transition duration-150 ease-in-out sm:text-sm sm:leading-5 bg-cool-gray-700 border border-cool-gray-500"
                value={data?.email}
                readOnly
              />
            </div>
          </div>
        </div>

        <div className="flex-grow space-y-1 lg:flex-grow-0 lg:flex-shrink-0">
          <p
            className="block text-sm leading-5 font-medium text-cool-gray-400"
            aria-hidden="true"
          >
            Avatar
          </p>
          <div className="lg:hidden">
            <div className="flex items-center">
              <div
                className="flex-shrink-0 inline-block rounded-full overflow-hidden h-12 w-12"
                aria-hidden="true"
              >
                <img
                  className="rounded-full h-full w-full"
                  src={data?.avatar}
                  alt=""
                />
              </div>
            </div>
          </div>

          <div className="hidden relative rounded-full overflow-hidden lg:block transition duration-150 ease-in-out">
            <img
              className="relative rounded-full w-40 h-40"
              src={data?.avatar}
              alt=""
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
