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
import Badge from '../Common/Badge';
import globalMessages from '../../i18n/globalMessages';
import PermissionEdit from '../PermissionEdit';

const messages = defineMessages({
  generalsettings: 'General Settings',
  generalsettingsDescription:
    'Configure global and default settings for Overseerr.',
  save: 'Save Changes',
  saving: 'Saving…',
  apikey: 'API Key',
  applicationurl: 'Application URL',
  toastApiKeySuccess: 'New API key generated!',
  toastApiKeyFailure: 'Something went wrong while generating a new API key.',
  toastSettingsSuccess: 'Settings successfully saved!',
  toastSettingsFailure: 'Something went wrong while saving settings.',
  defaultPermissions: 'Default User Permissions',
  hideAvailable: 'Hide Available Media',
  csrfProtection: 'Enable CSRF Protection',
  csrfProtectionTip:
    'Sets external API access to read-only (Overseerr must be reloaded for changes to take effect)',
  trustProxy: 'Enable Proxy Support',
  trustProxyTip:
    'Allows Overseerr to correctly register client IP addresses behind a proxy (Overseerr must be reloaded for changes to take effect)',
});

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
            csrfProtection: data?.csrfProtection,
            defaultPermissions: data?.defaultPermissions ?? 0,
            hideAvailable: data?.hideAvailable,
            trustProxy: data?.trustProxy,
          }}
          enableReinitialize
          onSubmit={async (values) => {
            try {
              await axios.post('/api/v1/settings/main', {
                applicationUrl: values.applicationUrl,
                csrfProtection: values.csrfProtection,
                defaultPermissions: values.defaultPermissions,
                hideAvailable: values.hideAvailable,
                trustProxy: values.trustProxy,
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
                  <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800">
                    <label
                      htmlFor="username"
                      className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px"
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
                <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800">
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px"
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
                <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800">
                  <label
                    htmlFor="trustProxy"
                    className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px"
                  >
                    <div className="flex flex-col">
                      <span className="mr-2">
                        {intl.formatMessage(messages.trustProxy)}
                      </span>
                      <span className="text-gray-500">
                        {intl.formatMessage(messages.trustProxyTip)}
                      </span>
                    </div>
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <Field
                      type="checkbox"
                      id="trustProxy"
                      name="trustProxy"
                      onChange={() => {
                        setFieldValue('trustProxy', !values.trustProxy);
                      }}
                      className="w-6 h-6 text-indigo-600 transition duration-150 ease-in-out rounded-md form-checkbox"
                    />
                  </div>
                </div>
                <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800">
                  <label
                    htmlFor="csrfProtection"
                    className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px"
                  >
                    <div className="flex flex-col">
                      <span className="mr-2">
                        {intl.formatMessage(messages.csrfProtection)}
                      </span>
                      <span className="text-gray-500">
                        {intl.formatMessage(messages.csrfProtectionTip)}
                      </span>
                    </div>
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <Field
                      type="checkbox"
                      id="csrfProtection"
                      name="csrfProtection"
                      onChange={() => {
                        setFieldValue('csrfProtection', !values.csrfProtection);
                      }}
                      className="w-6 h-6 text-indigo-600 transition duration-150 ease-in-out rounded-md form-checkbox"
                    />
                  </div>
                </div>
                <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800">
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px"
                  >
                    <span className="mr-2">
                      {intl.formatMessage(messages.hideAvailable)}
                    </span>
                    <Badge badgeType="warning">
                      {intl.formatMessage(globalMessages.experimental)}
                    </Badge>
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <Field
                      type="checkbox"
                      id="hideAvailable"
                      name="hideAvailable"
                      onChange={() => {
                        setFieldValue('hideAvailable', !values.hideAvailable);
                      }}
                      className="w-6 h-6 text-indigo-600 transition duration-150 ease-in-out rounded-md form-checkbox"
                    />
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
                          <PermissionEdit
                            currentPermission={values.defaultPermissions}
                            onUpdate={(newPermissions) =>
                              setFieldValue(
                                'defaultPermissions',
                                newPermissions
                              )
                            }
                          />
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
