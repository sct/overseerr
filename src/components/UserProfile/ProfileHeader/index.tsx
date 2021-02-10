import Link from 'next/link';
import React from 'react';
import { useIntl } from 'react-intl';
import { Permission, User, useUser } from '../../../hooks/useUser';
import Button from '../../Common/Button';

interface ProfileHeaderProps {
  user: User;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user }) => {
  const intl = useIntl();
  const { user: loggedInUser, hasPermission } = useUser();

  return (
    <div className="relative z-40 mt-6 mb-12 md:flex md:items-end md:justify-between md:space-x-5">
      <div className="flex items-end space-x-5 justify-items-end">
        <div className="flex-shrink-0">
          <div className="relative">
            <img className="w-24 h-24 rounded-full" src={user.avatar} alt="" />
            <span
              className="absolute inset-0 rounded-full shadow-inner"
              aria-hidden="true"
            ></span>
          </div>
        </div>
        <div className="pt-1.5">
          <h1 className="mb-1">
            <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-purple-400">
              {user.displayName}
            </span>
            {user.email && (
              <span className="ml-2 text-lg text-gray-400">({user.email})</span>
            )}
          </h1>
          <p className="text-sm font-medium text-gray-400">
            Joined {intl.formatDate(user.createdAt)} |{' '}
            {intl.formatNumber(user.requestCount)} Requests
          </p>
        </div>
      </div>
      <div className="flex flex-col-reverse mt-6 space-y-4 space-y-reverse justify-stretch sm:flex-row-reverse sm:justify-end sm:space-x-reverse sm:space-y-0 sm:space-x-3 md:mt-0 md:flex-row md:space-x-3">
        {hasPermission(Permission.MANAGE_USERS) && (
          <Link href={`/users/${user.id}/edit`}>
            <Button buttonType="warning" as="a">
              <svg
                className="w-5 h-5 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              <span>Edit User</span>
            </Button>
          </Link>
        )}
        {loggedInUser?.id === user.id && (
          <Link href={`/profile/settings`}>
            <Button as="a">
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                  clipRule="evenodd"
                />
              </svg>
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;
