import React, { useState, useEffect, useCallback, useRef } from 'react';
import Transition from '../../Transition';
import Modal from '../../Common/Modal';
import { Formik, Field } from 'formik';
import type { RadarrSettings } from '../../../../server/lib/settings';
import * as Yup from 'yup';
import axios from 'axios';
import { useToasts } from 'react-toast-notifications';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  createradarr: 'Create New Radarr Server',
  editradarr: 'Edit Radarr Server',
  validationNameRequired: 'You must provide a server name',
  validationHostnameRequired: 'You must provide a hostname/IP',
  validationPortRequired: 'You must provide a port',
  validationApiKeyRequired: 'You must provide an API key',
  validationRootFolderRequired: 'You must select a root folder',
  validationProfileRequired: 'You must select a profile',
  validationMinimumAvailabilityRequired: 'You must select minimum availability',
  toastRadarrTestSuccess: 'Radarr connection established!',
  toastRadarrTestFailure: 'Failed to connect to Radarr.',
  saving: 'Saving…',
  save: 'Save Changes',
  add: 'Add Server',
  test: 'Test',
  testing: 'Testing…',
  defaultserver: 'Default Server',
  servername: 'Server Name',
  servernamePlaceholder: 'A Radarr Server',
  hostname: 'Hostname',
  port: 'Port',
  ssl: 'SSL',
  apiKey: 'API Key',
  apiKeyPlaceholder: 'Your Radarr API key',
  baseUrl: 'Base URL',
  baseUrlPlaceholder: 'Example: /radarr',
  syncEnabled: 'Enable Sync',
  externalUrl: 'External URL',
  externalUrlPlaceholder: 'External URL pointing to your Radarr server',
  qualityprofile: 'Quality Profile',
  rootfolder: 'Root Folder',
  minimumAvailability: 'Minimum Availability',
  server4k: '4K Server',
  selectQualityProfile: 'Select quality profile',
  selectRootFolder: 'Select root folder',
  selectMinimumAvailability: 'Select minimum availability',
  loadingprofiles: 'Loading quality profiles…',
  testFirstQualityProfiles: 'Test connection to load quality profiles',
  loadingrootfolders: 'Loading root folders…',
  testFirstRootFolders: 'Test connection to load root folders',
  preventSearch: 'Disable Auto-Search',
});

interface TestResponse {
  profiles: {
    id: number;
    name: string;
  }[];
  rootFolders: {
    id: number;
    path: string;
  }[];
}

interface RadarrModalProps {
  radarr: RadarrSettings | null;
  onClose: () => void;
  onSave: () => void;
}

const RadarrModal: React.FC<RadarrModalProps> = ({
  onClose,
  radarr,
  onSave,
}) => {
  const intl = useIntl();
  const initialLoad = useRef(false);
  const { addToast } = useToasts();
  const [isValidated, setIsValidated] = useState(radarr ? true : false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResponse, setTestResponse] = useState<TestResponse>({
    profiles: [],
    rootFolders: [],
  });
  const RadarrSettingsSchema = Yup.object().shape({
    name: Yup.string().required(
      intl.formatMessage(messages.validationNameRequired)
    ),
    hostname: Yup.string().required(
      intl.formatMessage(messages.validationHostnameRequired)
    ),
    port: Yup.number().required(
      intl.formatMessage(messages.validationPortRequired)
    ),
    apiKey: Yup.string().required(intl.formatMessage(messages.apiKey)),
    rootFolder: Yup.string().required(
      intl.formatMessage(messages.validationRootFolderRequired)
    ),
    activeProfileId: Yup.string().required(
      intl.formatMessage(messages.validationProfileRequired)
    ),
    minimumAvailability: Yup.string().required(
      intl.formatMessage(messages.validationMinimumAvailabilityRequired)
    ),
  });

  const testConnection = useCallback(
    async ({
      hostname,
      port,
      apiKey,
      baseUrl,
      useSsl = false,
    }: {
      hostname: string;
      port: number;
      apiKey: string;
      baseUrl?: string;
      useSsl?: boolean;
    }) => {
      setIsTesting(true);
      try {
        const response = await axios.post<TestResponse>(
          '/api/v1/settings/radarr/test',
          {
            hostname,
            apiKey,
            port: Number(port),
            baseUrl,
            useSsl,
          }
        );

        setIsValidated(true);
        setTestResponse(response.data);
        if (initialLoad.current) {
          addToast(intl.formatMessage(messages.toastRadarrTestSuccess), {
            appearance: 'success',
            autoDismiss: true,
          });
        }
      } catch (e) {
        setIsValidated(false);
        if (initialLoad.current) {
          addToast(intl.formatMessage(messages.toastRadarrTestFailure), {
            appearance: 'error',
            autoDismiss: true,
          });
        }
      } finally {
        setIsTesting(false);
        initialLoad.current = true;
      }
    },
    [addToast]
  );

  useEffect(() => {
    if (radarr) {
      testConnection({
        apiKey: radarr.apiKey,
        hostname: radarr.hostname,
        port: radarr.port,
        baseUrl: radarr.baseUrl,
        useSsl: radarr.useSsl,
      });
    }
  }, [radarr, testConnection]);

  return (
    <Transition
      appear
      show
      enter="transition ease-in-out duration-300 transform opacity-0"
      enterFrom="opacity-0"
      enterTo="opacuty-100"
      leave="transition ease-in-out duration-300 transform opacity-100"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <Formik
        initialValues={{
          name: radarr?.name,
          hostname: radarr?.hostname,
          port: radarr?.port,
          ssl: radarr?.useSsl ?? false,
          apiKey: radarr?.apiKey,
          baseUrl: radarr?.baseUrl,
          activeProfileId: radarr?.activeProfileId,
          rootFolder: radarr?.activeDirectory,
          minimumAvailability: radarr?.minimumAvailability ?? 'released',
          isDefault: radarr?.isDefault ?? false,
          is4k: radarr?.is4k ?? false,
          externalUrl: radarr?.externalUrl,
          syncEnabled: radarr?.syncEnabled,
          preventSearch: radarr?.preventSearch,
        }}
        validationSchema={RadarrSettingsSchema}
        onSubmit={async (values) => {
          try {
            const profileName = testResponse.profiles.find(
              (profile) => profile.id === Number(values.activeProfileId)
            )?.name;

            const submission = {
              name: values.name,
              hostname: values.hostname,
              port: Number(values.port),
              apiKey: values.apiKey,
              useSsl: values.ssl,
              baseUrl: values.baseUrl,
              activeProfileId: Number(values.activeProfileId),
              activeProfileName: profileName,
              activeDirectory: values.rootFolder,
              is4k: values.is4k,
              minimumAvailability: values.minimumAvailability,
              isDefault: values.isDefault,
              externalUrl: values.externalUrl,
              syncEnabled: values.syncEnabled,
              preventSearch: values.preventSearch,
            };
            if (!radarr) {
              await axios.post('/api/v1/settings/radarr', submission);
            } else {
              await axios.put(
                `/api/v1/settings/radarr/${radarr.id}`,
                submission
              );
            }

            onSave();
          } catch (e) {
            // set error here
          }
        }}
      >
        {({
          errors,
          touched,
          values,
          handleSubmit,
          setFieldValue,
          isSubmitting,
          isValid,
        }) => {
          return (
            <Modal
              onCancel={onClose}
              okButtonType="primary"
              okText={
                isSubmitting
                  ? intl.formatMessage(messages.saving)
                  : radarr
                  ? intl.formatMessage(messages.save)
                  : intl.formatMessage(messages.add)
              }
              secondaryButtonType="warning"
              secondaryText={
                isTesting
                  ? intl.formatMessage(messages.testing)
                  : intl.formatMessage(messages.test)
              }
              onSecondary={() => {
                if (values.apiKey && values.hostname && values.port) {
                  testConnection({
                    apiKey: values.apiKey,
                    baseUrl: values.baseUrl,
                    hostname: values.hostname,
                    port: values.port,
                    useSsl: values.ssl,
                  });
                }
              }}
              secondaryDisabled={
                !values.apiKey || !values.hostname || !values.port || isTesting
              }
              okDisabled={!isValidated || isSubmitting || isTesting || !isValid}
              onOk={() => handleSubmit()}
              title={
                !radarr
                  ? intl.formatMessage(messages.createradarr)
                  : intl.formatMessage(messages.editradarr)
              }
            >
              <div className="mb-6">
                <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200">
                  <label
                    htmlFor="isDefault"
                    className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px"
                  >
                    {intl.formatMessage(messages.defaultserver)}
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <Field
                      type="checkbox"
                      id="isDefault"
                      name="isDefault"
                      className="w-6 h-6 text-indigo-600 transition duration-150 ease-in-out rounded-md form-checkbox"
                    />
                  </div>
                </div>
                <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200">
                  <label
                    htmlFor="is4k"
                    className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px"
                  >
                    {intl.formatMessage(messages.server4k)}
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <Field
                      type="checkbox"
                      id="is4k"
                      name="is4k"
                      className="w-6 h-6 text-indigo-600 transition duration-150 ease-in-out rounded-md form-checkbox"
                    />
                  </div>
                </div>
                <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800">
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px"
                  >
                    {intl.formatMessage(messages.servername)}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <div className="flex max-w-lg rounded-md shadow-sm">
                      <Field
                        id="name"
                        name="name"
                        type="text"
                        placeholder={intl.formatMessage(
                          messages.servernamePlaceholder
                        )}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setIsValidated(false);
                          setFieldValue('name', e.target.value);
                        }}
                        className="flex-1 block w-full min-w-0 transition duration-150 ease-in-out bg-gray-700 border border-gray-500 rounded-md form-input sm:text-sm sm:leading-5"
                      />
                    </div>
                    {errors.name && touched.name && (
                      <div className="mt-2 text-red-500">{errors.name}</div>
                    )}
                  </div>
                </div>
                <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800">
                  <label
                    htmlFor="hostname"
                    className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px"
                  >
                    {intl.formatMessage(messages.hostname)}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <div className="flex max-w-lg rounded-md shadow-sm">
                      <span className="inline-flex items-center px-3 text-gray-100 bg-gray-600 border border-r-0 border-gray-500 cursor-default rounded-l-md sm:text-sm">
                        {values.ssl ? 'https://' : 'http://'}
                      </span>
                      <Field
                        id="hostname"
                        name="hostname"
                        type="text"
                        placeholder="127.0.0.1"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setIsValidated(false);
                          setFieldValue('hostname', e.target.value);
                        }}
                        className="flex-1 block w-full min-w-0 transition duration-150 ease-in-out bg-gray-700 border border-gray-500 form-input rounded-r-md sm:text-sm sm:leading-5"
                      />
                    </div>
                    {errors.hostname && touched.hostname && (
                      <div className="mt-2 text-red-500">{errors.hostname}</div>
                    )}
                  </div>
                </div>
                <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200">
                  <label
                    htmlFor="port"
                    className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px"
                  >
                    {intl.formatMessage(messages.port)}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <Field
                      id="port"
                      name="port"
                      type="text"
                      placeholder="7878"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setIsValidated(false);
                        setFieldValue('port', e.target.value);
                      }}
                      className="block w-24 transition duration-150 ease-in-out bg-gray-700 border border-gray-500 rounded-md shadow-sm form-input sm:text-sm sm:leading-5"
                    />
                    {errors.port && touched.port && (
                      <div className="mt-2 text-red-500">{errors.port}</div>
                    )}
                  </div>
                </div>
                <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200">
                  <label
                    htmlFor="ssl"
                    className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px"
                  >
                    {intl.formatMessage(messages.ssl)}
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <Field
                      type="checkbox"
                      id="ssl"
                      name="ssl"
                      onChange={() => {
                        setIsValidated(false);
                        setFieldValue('ssl', !values.ssl);
                      }}
                      className="w-6 h-6 text-indigo-600 transition duration-150 ease-in-out rounded-md form-checkbox"
                    />
                  </div>
                </div>
                <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800">
                  <label
                    htmlFor="apiKey"
                    className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px"
                  >
                    {intl.formatMessage(messages.apiKey)}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <div className="flex max-w-lg rounded-md shadow-sm">
                      <Field
                        id="apiKey"
                        name="apiKey"
                        type="text"
                        placeholder={intl.formatMessage(
                          messages.apiKeyPlaceholder
                        )}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setIsValidated(false);
                          setFieldValue('apiKey', e.target.value);
                        }}
                        className="flex-1 block w-full min-w-0 transition duration-150 ease-in-out bg-gray-700 border border-gray-500 rounded-md form-input sm:text-sm sm:leading-5"
                      />
                    </div>
                    {errors.apiKey && touched.apiKey && (
                      <div className="mt-2 text-red-500">{errors.apiKey}</div>
                    )}
                  </div>
                </div>
                <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800">
                  <label
                    htmlFor="baseUrl"
                    className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px"
                  >
                    {intl.formatMessage(messages.baseUrl)}
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <div className="flex max-w-lg rounded-md shadow-sm">
                      <Field
                        id="baseUrl"
                        name="baseUrl"
                        type="text"
                        placeholder={intl.formatMessage(
                          messages.baseUrlPlaceholder
                        )}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setIsValidated(false);
                          setFieldValue('baseUrl', e.target.value);
                        }}
                        className="flex-1 block w-full min-w-0 transition duration-150 ease-in-out bg-gray-700 border border-gray-500 rounded-md form-input sm:text-sm sm:leading-5"
                      />
                    </div>
                    {errors.baseUrl && touched.baseUrl && (
                      <div className="mt-2 text-red-500">{errors.baseUrl}</div>
                    )}
                  </div>
                </div>
                <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800">
                  <label
                    htmlFor="activeProfileId"
                    className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px"
                  >
                    {intl.formatMessage(messages.qualityprofile)}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <div className="flex max-w-lg rounded-md shadow-sm">
                      <Field
                        as="select"
                        id="activeProfileId"
                        name="activeProfileId"
                        disabled={!isValidated || isTesting}
                        className="block w-full py-2 pl-3 pr-10 mt-1 text-base leading-6 bg-gray-700 border-gray-500 rounded-md form-select focus:outline-none focus:ring-blue focus:border-gray-500 sm:text-sm sm:leading-5 disabled:opacity-50"
                      >
                        <option value="">
                          {isTesting
                            ? intl.formatMessage(messages.loadingprofiles)
                            : !isValidated
                            ? intl.formatMessage(
                                messages.testFirstQualityProfiles
                              )
                            : intl.formatMessage(messages.selectQualityProfile)}
                        </option>
                        {testResponse.profiles.length > 0 &&
                          testResponse.profiles.map((profile) => (
                            <option
                              key={`loaded-profile-${profile.id}`}
                              value={profile.id}
                            >
                              {profile.name}
                            </option>
                          ))}
                      </Field>
                    </div>
                    {errors.activeProfileId && touched.activeProfileId && (
                      <div className="mt-2 text-red-500">
                        {errors.activeProfileId}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-8005">
                  <label
                    htmlFor="rootFolder"
                    className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px"
                  >
                    {intl.formatMessage(messages.rootfolder)}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <div className="flex max-w-lg rounded-md shadow-sm">
                      <Field
                        as="select"
                        id="rootFolder"
                        name="rootFolder"
                        disabled={!isValidated || isTesting}
                        className="block w-full py-2 pl-3 pr-10 mt-1 text-base leading-6 bg-gray-700 border-gray-500 rounded-md form-select focus:outline-none focus:ring-blue focus:border-gray-500 sm:text-sm sm:leading-5 disabled:opacity-50"
                      >
                        <option value="">
                          {isTesting
                            ? intl.formatMessage(messages.loadingrootfolders)
                            : !isValidated
                            ? intl.formatMessage(messages.testFirstRootFolders)
                            : intl.formatMessage(messages.selectRootFolder)}
                        </option>
                        {testResponse.rootFolders.length > 0 &&
                          testResponse.rootFolders.map((folder) => (
                            <option
                              key={`loaded-profile-${folder.id}`}
                              value={folder.path}
                            >
                              {folder.path}
                            </option>
                          ))}
                      </Field>
                    </div>
                    {errors.rootFolder && touched.rootFolder && (
                      <div className="mt-2 text-red-500">
                        {errors.rootFolder}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800">
                  <label
                    htmlFor="minimumAvailability"
                    className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px"
                  >
                    {intl.formatMessage(messages.minimumAvailability)}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <div className="flex max-w-lg rounded-md shadow-sm">
                      <Field
                        as="select"
                        id="minimumAvailability"
                        name="minimumAvailability"
                        className="block w-full py-2 pl-3 pr-10 mt-1 text-base leading-6 bg-gray-700 border-gray-500 rounded-md form-select focus:outline-none focus:ring-blue focus:border-gray-500 sm:text-sm sm:leading-5"
                      >
                        <option value="announced">Announced</option>
                        <option value="inCinemas">In Cinemas</option>
                        <option value="released">Released</option>
                        <option value="preDB">PreDB</option>
                      </Field>
                    </div>
                    {errors.minimumAvailability &&
                      touched.minimumAvailability && (
                        <div className="mt-2 text-red-500">
                          {errors.minimumAvailability}
                        </div>
                      )}
                  </div>
                </div>
                <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800">
                  <label
                    htmlFor="externalUrl"
                    className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px"
                  >
                    {intl.formatMessage(messages.externalUrl)}
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <div className="flex max-w-lg rounded-md shadow-sm">
                      <Field
                        id="externalUrl"
                        name="externalUrl"
                        type="text"
                        placeholder={intl.formatMessage(
                          messages.externalUrlPlaceholder
                        )}
                        className="flex-1 block w-full min-w-0 transition duration-150 ease-in-out bg-gray-700 border border-gray-500 rounded-md form-input sm:text-sm sm:leading-5"
                      />
                    </div>
                    {errors.externalUrl && touched.externalUrl && (
                      <div className="mt-2 text-red-500">
                        {errors.externalUrl}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200">
                  <label
                    htmlFor="syncEnabled"
                    className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px"
                  >
                    {intl.formatMessage(messages.syncEnabled)}
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <Field
                      type="checkbox"
                      id="syncEnabled"
                      name="syncEnabled"
                      className="w-6 h-6 text-indigo-600 transition duration-150 ease-in-out rounded-md form-checkbox"
                    />
                  </div>
                </div>
                <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200">
                  <label
                    htmlFor="preventSearch"
                    className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px"
                  >
                    {intl.formatMessage(messages.preventSearch)}
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <Field
                      type="checkbox"
                      id="preventSearch"
                      name="preventSearch"
                      className="w-6 h-6 text-indigo-600 transition duration-150 ease-in-out rounded-md form-checkbox"
                    />
                  </div>
                </div>
              </div>
            </Modal>
          );
        }}
      </Formik>
    </Transition>
  );
};

export default RadarrModal;
