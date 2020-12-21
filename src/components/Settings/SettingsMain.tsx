import React from 'react';
import useSWR from 'swr';
import LoadingSpinner from '../Common/LoadingSpinner';
import type { MainSettings } from '../../../server/lib/settings';
import CopyButton from './CopyButton';
import { Form, Formik, Field } from 'formik';
import axios from 'axios';
import Button from '../Common/Button';
import { defineMessages, useIntl } from 'react-intl';
import { useUser, Permission } from '../../hooks/useUser';
import { useToasts } from 'react-toast-notifications';
import { messages as permissionMessages } from '../UserEdit';
import { hasPermission } from '../../../server/lib/permissions';

const messages = defineMessages({
  generalsettings: 'General Settings',
  generalsettingsDescription:
    'These are settings related to general Overseerr configuration.',
  save: 'Save Changes',
  saving: 'Saving...',
  apikey: 'API Key',
  applicationurl: 'Application URL',
  toastApiKeySuccess: 'New API Key generated!',
  toastApiKeyFailure: 'Something went wrong generating a new API Key.',
  toastSettingsSuccess: 'Settings saved.',
  toastSettingsFailure: 'Something went wrong saving settings.',
  defaultPermissions: 'Default User Permissions',
});

interface PermissionOption {
  id: string;
  name: string;
  description: string;
  permission: Permission;
}

const SettingsMain: React.FC = () => {
  const { addToast } = useToasts();
  const { hasPermission: userHasPermission } = useUser();
  const intl = useIntl();
  const { data, error, revalidate } = useSWR<MainSettings>(
    '/api/v1/settings/main'
  );

  const regenerate = async () => {
    try {
      await axios.get('/api/v1/settings/main/regenerate');

      revalidate();
      addToast(intl.formatMessage(messages.toastApiKeySuccess), {
        autoDismiss: true,
        appearance: 'success',
      });
    } catch (e) {
      addToast(intl.formatMessage(messages.toastApiKeyFailure), {
        autoDismiss: true,
        appearance: 'error',
      });
    }
  };

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  const permissionList: PermissionOption[] = [
    {
      id: 'admin',
      name: intl.formatMessage(permissionMessages.admin),
      description: intl.formatMessage(permissionMessages.adminDescription),
      permission: Permission.ADMIN,
    },
    {
      id: 'settings',
      name: intl.formatMessage(permissionMessages.settings),
      description: intl.formatMessage(permissionMessages.settingsDescription),
      permission: Permission.MANAGE_SETTINGS,
    },
    {
      id: 'users',
      name: intl.formatMessage(permissionMessages.users),
      description: intl.formatMessage(permissionMessages.usersDescription),
      permission: Permission.MANAGE_USERS,
    },
    {
      id: 'managerequest',
      name: intl.formatMessage(permissionMessages.managerequests),
      description: intl.formatMessage(
        permissionMessages.managerequestsDescription
      ),
      permission: Permission.MANAGE_REQUESTS,
    },
    {
      id: 'request',
      name: intl.formatMessage(permissionMessages.request),
      description: intl.formatMessage(permissionMessages.requestDescription),
      permission: Permission.REQUEST,
    },
    {
      id: 'vote',
      name: intl.formatMessage(permissionMessages.vote),
      description: intl.formatMessage(permissionMessages.voteDescription),
      permission: Permission.VOTE,
    },
    {
      id: 'autoapprove',
      name: intl.formatMessage(permissionMessages.autoapprove),
      description: intl.formatMessage(
        permissionMessages.autoapproveDescription
      ),
      permission: Permission.AUTO_APPROVE,
    },
  ];

  return (
    <>
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-200">
          {intl.formatMessage(messages.generalsettings)}
        </h3>
        <p className="max-w-2xl mt-1 text-sm leading-5 text-gray-500">
          {intl.formatMessage(messages.generalsettingsDescription)}
        </p>
      </div>
      <div className="mt-6 sm:mt-5">
        <Formik
          initialValues={{
            applicationUrl: data?.applicationUrl,
            defaultPermissions: data?.defaultPermissions ?? 0,
          }}
          enableReinitialize
          onSubmit={async (values) => {
            try {
              await axios.post('/api/v1/settings/main', {
                applicationUrl: values.applicationUrl,
                defaultPermissions: values.defaultPermissions,
              });

              addToast(intl.formatMessage(messages.toastSettingsSuccess), {
                autoDismiss: true,
                appearance: 'success',
              });
            } catch (e) {
              addToast(intl.formatMessage(messages.toastSettingsFailure), {
                autoDismiss: true,
                appearance: 'error',
              });
            } finally {
              revalidate();
            }
          }}
        >
          {({ isSubmitting, values, setFieldValue }) => {
            return (
              <Form>
                {userHasPermission(Permission.ADMIN) && (
                  <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800 sm:pt-5">
                    <label
                      htmlFor="username"
                      className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px sm:pt-2"
                    >
                      {intl.formatMessage(messages.apikey)}
                    </label>
                    <div className="mt-1 sm:mt-0 sm:col-span-2">
                      <div className="flex max-w-lg rounded-md shadow-sm">
                        <input
                          type="text"
                          id="apiKey"
                          className="flex-1 block w-full min-w-0 transition duration-150 ease-in-out bg-gray-700 border border-gray-500 rounded-none form-input rounded-l-md sm:text-sm sm:leading-5"
                          value={data?.apiKey}
                          readOnly
                        />
                        <CopyButton
                          textToCopy={data?.apiKey ?? ''}
                          key={data?.apiKey}
                        />
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            regenerate();
                          }}
                          className="relative inline-flex items-center px-4 py-2 -ml-px text-sm font-medium leading-5 text-white transition duration-150 ease-in-out bg-indigo-500 border border-gray-500 rounded-r-md hover:bg-indigo-400 focus:outline-none focus:ring-blue focus:border-blue-300 active:bg-gray-100 active:text-gray-700"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800 sm:pt-5">
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px sm:pt-2"
                  >
                    {intl.formatMessage(messages.applicationurl)}
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <div className="flex max-w-lg rounded-md shadow-sm">
                      <Field
                        id="applicationUrl"
                        name="applicationUrl"
                        type="text"
                        placeholder="https://os.example.com"
                        className="flex-1 block w-full min-w-0 transition duration-150 ease-in-out bg-gray-700 border border-gray-500 rounded-md form-input sm:text-sm sm:leading-5"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <div role="group" aria-labelledby="label-permissions">
                    <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-baseline">
                      <div>
                        <div
                          className="text-base font-medium leading-6 text-gray-400 sm:text-sm sm:leading-5"
                          id="label-permissions"
                        >
                          {intl.formatMessage(messages.defaultPermissions)}
                        </div>
                      </div>
                      <div className="mt-4 sm:mt-0 sm:col-span-2">
                        <div className="max-w-lg">
                          {permissionList.map((permissionOption) => (
                            <div
                              className={`relative flex items-start first:mt-0 mt-4 ${
                                permissionOption.permission !==
                                  Permission.ADMIN &&
                                hasPermission(
                                  Permission.ADMIN,
                                  values.defaultPermissions
                                )
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
                                  className="w-4 h-4 text-indigo-600 transition duration-150 ease-in-out rounded-md form-checkbox"
                                  disabled={
                                    permissionOption.permission !==
                                      Permission.ADMIN &&
                                    hasPermission(
                                      Permission.ADMIN,
                                      values.defaultPermissions
                                    )
                                  }
                                  onClick={() => {
                                    setFieldValue(
                                      'defaultPermissions',
                                      hasPermission(
                                        permissionOption.permission,
                                        values.defaultPermissions
                                      )
                                        ? values.defaultPermissions -
                                            permissionOption.permission
                                        : values.defaultPermissions +
                                            permissionOption.permission
                                    );
                                  }}
                                  checked={hasPermission(
                                    permissionOption.permission,
                                    values.defaultPermissions
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
                <div className="pt-5 mt-8 border-t border-gray-700">
                  <div className="flex justify-end">
                    <span className="inline-flex ml-3 rounded-md shadow-sm">
                      <Button
                        buttonType="primary"
                        type="submit"
                        disabled={isSubmitting}
                      >
                        {isSubmitting
                          ? intl.formatMessage(messages.saving)
                          : intl.formatMessage(messages.save)}
                      </Button>
                    </span>
                  </div>
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>
    </>
  );
};

export default SettingsMain;
