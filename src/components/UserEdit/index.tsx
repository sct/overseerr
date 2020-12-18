import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import LoadingSpinner from '../Common/LoadingSpinner';
import { Permission, useUser } from '../../hooks/useUser';
import { hasPermission } from '../../../server/lib/permissions';
import Button from '../Common/Button';
import { useIntl, defineMessages, FormattedMessage } from 'react-intl';
import axios from 'axios';
import { useToasts } from 'react-toast-notifications';
import Header from '../Common/Header';

const messages = defineMessages({
  edituser: 'Edit User',
  username: 'Username',
  avatar: 'Avatar',
  email: 'Email',
  permissions: 'Permissions',
  admin: 'Admin',
  adminDescription:
    'Full administrator access. Bypasses all permission checks.',
  users: 'Manage Users',
  usersDescription:
    'Grants permission to manage Overseerr users. Users with this permission cannot modify users with Administrator privilege, or grant it.',
  settings: 'Manage Settings',
  settingsDescription:
    'Grants permission to modify all Overseerr settings. A user must have this permission to grant it to others.',
  managerequests: 'Manage Requests',
  managerequestsDescription:
    'Grants permission to manage Overseerr requests. This includes approving and denying requests.',
  request: 'Request',
  requestDescription: 'Grants permission to request movies and series.',
  vote: 'Vote',
  voteDescription:
    'Grants permission to vote on requests (voting not yet implemented)',
  autoapprove: 'Auto Approve',
  autoapproveDescription:
    'Grants auto approval for any requests made by this user.',
  save: 'Save',
  saving: 'Saving...',
  usersaved: 'User saved',
  userfail: 'Something went wrong saving the user.',
});

interface PermissionOption {
  id: string;
  name: string;
  description: string;
  permission: Permission;
}

const UserEdit: React.FC = () => {
  const router = useRouter();
  const intl = useIntl();
  const { addToast } = useToasts();
  const [isUpdating, setIsUpdating] = useState(false);
  const { user: currentUser, hasPermission: currentHasPermission } = useUser();
  const { user, error, revalidate } = useUser({
    id: Number(router.query.userId),
  });
  const [currentPermission, setCurrentPermission] = useState(0);

  useEffect(() => {
    if (currentPermission !== user?.permissions ?? 0) {
      setCurrentPermission(user?.permissions ?? 0);
    }
    // We know what we are doing here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const updateUser = async () => {
    try {
      setIsUpdating(true);

      await axios.put(`/api/v1/user/${user?.id}`, {
        permissions: currentPermission,
        email: user?.email,
        avatar: user?.avatar,
      });

      addToast(intl.formatMessage(messages.usersaved), {
        appearance: 'success',
        autoDismiss: true,
      });
    } catch (e) {
      addToast(intl.formatMessage(messages.userfail), {
        appearance: 'error',
        autoDismiss: true,
      });
      throw new Error(`Something went wrong saving the user: ${e.message}`);
    } finally {
      revalidate();
      setIsUpdating(false);
    }
  };

  if (!user && !error) {
    return <LoadingSpinner />;
  }

  const permissionList: PermissionOption[] = [
    {
      id: 'admin',
      name: intl.formatMessage(messages.admin),
      description: intl.formatMessage(messages.adminDescription),
      permission: Permission.ADMIN,
    },
    {
      id: 'settings',
      name: intl.formatMessage(messages.settings),
      description: intl.formatMessage(messages.settingsDescription),
      permission: Permission.MANAGE_SETTINGS,
    },
    {
      id: 'users',
      name: intl.formatMessage(messages.users),
      description: intl.formatMessage(messages.usersDescription),
      permission: Permission.MANAGE_USERS,
    },
    {
      id: 'managerequest',
      name: intl.formatMessage(messages.managerequests),
      description: intl.formatMessage(messages.managerequestsDescription),
      permission: Permission.MANAGE_REQUESTS,
    },
    {
      id: 'request',
      name: intl.formatMessage(messages.request),
      description: intl.formatMessage(messages.requestDescription),
      permission: Permission.REQUEST,
    },
    {
      id: 'vote',
      name: intl.formatMessage(messages.vote),
      description: intl.formatMessage(messages.voteDescription),
      permission: Permission.VOTE,
    },
    {
      id: 'autoapprove',
      name: intl.formatMessage(messages.autoapprove),
      description: intl.formatMessage(messages.autoapproveDescription),
      permission: Permission.AUTO_APPROVE,
    },
  ];

  return (
    <>
      <Header extraMargin={4}>
        <FormattedMessage {...messages.edituser} />
      </Header>
      <div className="px-4 space-y-6 sm:p-6 lg:pb-8">
        <div className="flex flex-col space-y-6 lg:flex-row lg:space-y-0 lg:space-x-6 text-white">
          <div className="flex-grow space-y-6">
            <div className="space-y-1">
              <label
                htmlFor="username"
                className="block text-sm font-medium leading-5 text-gray-400"
              >
                <FormattedMessage {...messages.username} />
              </label>
              <div className="rounded-md shadow-sm flex">
                <input
                  id="username"
                  type="text"
                  className="form-input flex-grow block w-full min-w-0 rounded-md transition duration-150 ease-in-out sm:text-sm sm:leading-5 bg-gray-700 border border-gray-500"
                  value={user?.username}
                  readOnly
                />
              </div>
            </div>
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="block text-sm font-medium leading-5 text-gray-400"
              >
                <FormattedMessage {...messages.email} />
              </label>
              <div className="rounded-md shadow-sm flex">
                <input
                  id="email"
                  type="text"
                  className="form-input flex-grow block w-full min-w-0 rounded-md transition duration-150 ease-in-out sm:text-sm sm:leading-5 bg-gray-700 border border-gray-500"
                  value={user?.email}
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="flex-grow space-y-1 lg:flex-grow-0 lg:flex-shrink-0">
            <p
              className="block text-sm leading-5 font-medium text-gray-400"
              aria-hidden="true"
            >
              <FormattedMessage {...messages.avatar} />
            </p>
            <div className="lg:hidden">
              <div className="flex items-center">
                <div
                  className="flex-shrink-0 inline-block rounded-full overflow-hidden h-12 w-12"
                  aria-hidden="true"
                >
                  <img
                    className="rounded-full h-full w-full"
                    src={user?.avatar}
                    alt=""
                  />
                </div>
              </div>
            </div>

            <div className="hidden relative rounded-full overflow-hidden lg:block transition duration-150 ease-in-out">
              <img
                className="relative rounded-full w-40 h-40"
                src={user?.avatar}
                alt=""
              />
            </div>
          </div>
        </div>
        <div className="text-white">
          <div className="sm:border-t sm:border-gray-200 sm:pt-5">
            <div role="group" aria-labelledby="label-permissions">
              <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-baseline">
                <div>
                  <div
                    className="text-base leading-6 font-medium sm:text-sm sm:leading-5"
                    id="label-permissions"
                  >
                    <FormattedMessage {...messages.permissions} />
                  </div>
                </div>
                <div className="mt-4 sm:mt-0 sm:col-span-2">
                  <div className="max-w-lg">
                    {permissionList.map((permissionOption) => (
                      <div
                        className={`relative flex items-start first:mt-0 mt-4 ${
                          (permissionOption.permission !== Permission.ADMIN &&
                            hasPermission(
                              Permission.ADMIN,
                              currentPermission
                            )) ||
                          (currentUser?.id !== 1 &&
                            permissionOption.permission === Permission.ADMIN) ||
                          (!currentHasPermission(Permission.MANAGE_SETTINGS) &&
                            permissionOption.permission ===
                              Permission.MANAGE_SETTINGS)
                            ? 'opacity-50'
                            : ''
                        }`}
                        key={`permission-option-${permissionOption.id}`}
                      >
                        <div className="flex items-center h-5">
                          <input
                            id={permissionOption.id}
                            name="permissions"
                            type="checkbox"
                            className="form-checkbox h-4 w-4 rounded-md text-indigo-600 transition duration-150 ease-in-out"
                            disabled={
                              (permissionOption.permission !==
                                Permission.ADMIN &&
                                hasPermission(
                                  Permission.ADMIN,
                                  currentPermission
                                )) ||
                              (currentUser?.id !== 1 &&
                                permissionOption.permission ===
                                  Permission.ADMIN) ||
                              (!currentHasPermission(
                                Permission.MANAGE_SETTINGS
                              ) &&
                                permissionOption.permission ===
                                  Permission.MANAGE_SETTINGS)
                            }
                            onClick={() => {
                              setCurrentPermission((current) =>
                                hasPermission(
                                  permissionOption.permission,
                                  currentPermission
                                )
                                  ? current - permissionOption.permission
                                  : current + permissionOption.permission
                              );
                            }}
                            checked={hasPermission(
                              permissionOption.permission,
                              currentPermission
                            )}
                          />
                        </div>
                        <div className="ml-3 text-sm leading-5">
                          <label
                            htmlFor={permissionOption.id}
                            className="font-medium"
                          >
                            {permissionOption.name}
                          </label>
                          <p className="text-gray-500">
                            {permissionOption.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-700 pt-5">
            <div className="flex justify-end">
              <span className="ml-3 inline-flex rounded-md shadow-sm">
                <Button
                  buttonType="primary"
                  type="submit"
                  disabled={isUpdating}
                  onClick={() => updateUser()}
                >
                  {isUpdating
                    ? intl.formatMessage(messages.saving)
                    : intl.formatMessage(messages.save)}
                </Button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserEdit;
