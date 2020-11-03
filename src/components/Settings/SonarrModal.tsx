import React, { useState, useEffect, useCallback, useRef } from 'react';
import Transition from '../Transition';
import Modal from '../Common/Modal';
import { Formik, Field } from 'formik';
import type { SonarrSettings } from '../../../server/lib/settings';
import * as Yup from 'yup';
import axios from 'axios';
import { useToasts } from 'react-toast-notifications';

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

interface SonarrModalProps {
  sonarr: SonarrSettings | null;
  onClose: () => void;
  onSave: () => void;
}

const SonarrModal: React.FC<SonarrModalProps> = ({
  onClose,
  sonarr,
  onSave,
}) => {
  const initialLoad = useRef(false);
  const { addToast } = useToasts();
  const [isValidated, setIsValidated] = useState(sonarr ? true : false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResponse, setTestResponse] = useState<TestResponse>({
    profiles: [],
    rootFolders: [],
  });
  const SonarrSettingsSchema = Yup.object().shape({
    hostname: Yup.string().required('You must provide a hostname/IP'),
    port: Yup.number().required('You must provide a port'),
    apiKey: Yup.string().required('You must provide an API Key'),
    rootFolder: Yup.string().required('You must select a root folder'),
    activeProfileId: Yup.string().required('You must select a profile'),
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
          '/api/v1/settings/sonarr/test',
          {
            hostname,
            apiKey,
            port,
            baseUrl,
            useSsl,
          }
        );

        setIsValidated(true);
        setTestResponse(response.data);
        if (initialLoad.current) {
          addToast('Sonarr connection established!', {
            appearance: 'success',
            autoDismiss: true,
          });
        }
      } catch (e) {
        setIsValidated(false);
        if (initialLoad.current) {
          addToast('Failed to connect to Sonarr server', {
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
    if (sonarr) {
      testConnection({
        apiKey: sonarr.apiKey,
        hostname: sonarr.hostname,
        port: sonarr.port,
        baseUrl: sonarr.baseUrl,
        useSsl: sonarr.useSsl,
      });
    }
  }, [sonarr, testConnection]);

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
          name: sonarr?.name,
          hostname: sonarr?.hostname,
          port: sonarr?.port,
          ssl: sonarr?.useSsl ?? false,
          apiKey: sonarr?.apiKey,
          baseUrl: sonarr?.baseUrl,
          activeProfileId: sonarr?.activeProfileId,
          rootFolder: sonarr?.activeDirectory,
          isDefault: sonarr?.isDefault ?? false,
          is4k: sonarr?.is4k ?? false,
          enableSeasonFolders: sonarr?.enableSeasonFolders ?? false,
        }}
        validationSchema={SonarrSettingsSchema}
        onSubmit={async (values) => {
          try {
            const profileName = testResponse.profiles.find(
              (profile) => profile.id === Number(values.activeProfileId)
            )?.name;

            const submission = {
              name: values.name,
              hostname: values.hostname,
              port: values.port,
              apiKey: values.apiKey,
              useSsl: values.ssl,
              baseUrl: values.baseUrl,
              activeProfileId: values.activeProfileId,
              activeProfileName: profileName,
              activeDirectory: values.rootFolder,
              is4k: values.is4k,
              isDefault: values.isDefault,
              enableSeasonFolders: values.enableSeasonFolders,
            };
            if (!sonarr) {
              await axios.post('/api/v1/settings/sonarr', submission);
            } else {
              await axios.put(
                `/api/v1/settings/sonarr/${sonarr.id}`,
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
        }) => {
          return (
            <Modal
              onCancel={onClose}
              okButtonType="primary"
              okText={
                isSubmitting
                  ? 'Saving...'
                  : !!sonarr
                  ? 'Save Changes'
                  : 'Create Instance'
              }
              secondaryButtonType="warning"
              secondaryText={isTesting ? 'Testing...' : 'Test'}
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
              okDisabled={!isValidated || isSubmitting || isTesting}
              onOk={() => handleSubmit()}
              title={
                !sonarr ? 'Create New Sonarr Server' : 'Edit Sonarr Server'
              }
            >
              <div className="mb-6">
                <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
                  <label
                    htmlFor="isDefault"
                    className="block text-sm font-medium leading-5 text-cool-gray-400 sm:mt-px sm:pt-2"
                  >
                    Default Server
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <Field
                      type="checkbox"
                      id="isDefault"
                      name="isDefault"
                      className="form-checkbox h-6 w-6 text-indigo-600 transition duration-150 ease-in-out"
                    />
                  </div>
                </div>
                <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800 sm:pt-5">
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium leading-5 text-cool-gray-400 sm:mt-px sm:pt-2"
                  >
                    Server Name
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <div className="max-w-lg flex rounded-md shadow-sm">
                      <Field
                        id="name"
                        name="name"
                        type="input"
                        placeholder="A Sonarr Server"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setIsValidated(false);
                          setFieldValue('name', e.target.value);
                        }}
                        className="flex-1 form-input block w-full min-w-0 rounded-md transition duration-150 ease-in-out sm:text-sm sm:leading-5 bg-cool-gray-700 border border-cool-gray-500"
                      />
                    </div>
                    {errors.name && touched.name && (
                      <div className="text-red-500 mt-2">{errors.name}</div>
                    )}
                  </div>
                </div>
                <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800 sm:pt-5">
                  <label
                    htmlFor="hostname"
                    className="block text-sm font-medium leading-5 text-cool-gray-400 sm:mt-px sm:pt-2"
                  >
                    Hostname
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <div className="max-w-lg flex rounded-md shadow-sm">
                      <Field
                        id="hostname"
                        name="hostname"
                        type="input"
                        placeholder="127.0.0.1"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setIsValidated(false);
                          setFieldValue('hostname', e.target.value);
                        }}
                        className="flex-1 form-input block w-full min-w-0 rounded-md transition duration-150 ease-in-out sm:text-sm sm:leading-5 bg-cool-gray-700 border border-cool-gray-500"
                      />
                    </div>
                    {errors.hostname && touched.hostname && (
                      <div className="text-red-500 mt-2">{errors.hostname}</div>
                    )}
                  </div>
                </div>
                <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
                  <label
                    htmlFor="port"
                    className="block text-sm font-medium leading-5 text-cool-gray-400 sm:mt-px sm:pt-2"
                  >
                    Port
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <Field
                      id="port"
                      name="port"
                      type="input"
                      placeholder="8989"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setIsValidated(false);
                        setFieldValue('port', e.target.value);
                      }}
                      className="rounded-md shadow-sm form-input block w-24 transition duration-150 ease-in-out sm:text-sm sm:leading-5 bg-cool-gray-700 border border-cool-gray-500"
                    />
                    {errors.port && touched.port && (
                      <div className="text-red-500 mt-2">{errors.port}</div>
                    )}
                  </div>
                </div>
                <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
                  <label
                    htmlFor="ssl"
                    className="block text-sm font-medium leading-5 text-cool-gray-400 sm:mt-px sm:pt-2"
                  >
                    SSL
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
                      className="form-checkbox h-6 w-6 text-indigo-600 transition duration-150 ease-in-out"
                    />
                  </div>
                </div>
                <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800 sm:pt-5">
                  <label
                    htmlFor="apiKey"
                    className="block text-sm font-medium leading-5 text-cool-gray-400 sm:mt-px sm:pt-2"
                  >
                    API Key
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <div className="max-w-lg flex rounded-md shadow-sm">
                      <Field
                        id="apiKey"
                        name="apiKey"
                        type="input"
                        placeholder="Your Sonarr API Key"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setIsValidated(false);
                          setFieldValue('apiKey', e.target.value);
                        }}
                        className="flex-1 form-input block w-full min-w-0 rounded-md transition duration-150 ease-in-out sm:text-sm sm:leading-5 bg-cool-gray-700 border border-cool-gray-500"
                      />
                    </div>
                    {errors.apiKey && touched.apiKey && (
                      <div className="text-red-500 mt-2">{errors.apiKey}</div>
                    )}
                  </div>
                </div>
                <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800 sm:pt-5">
                  <label
                    htmlFor="baseUrl"
                    className="block text-sm font-medium leading-5 text-cool-gray-400 sm:mt-px sm:pt-2"
                  >
                    Base URL
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <div className="max-w-lg flex rounded-md shadow-sm">
                      <Field
                        id="baseUrl"
                        name="baseUrl"
                        type="input"
                        placeholder="Example: /sonarr"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setIsValidated(false);
                          setFieldValue('baseUrl', e.target.value);
                        }}
                        className="flex-1 form-input block w-full min-w-0 rounded-md transition duration-150 ease-in-out sm:text-sm sm:leading-5 bg-cool-gray-700 border border-cool-gray-500"
                      />
                    </div>
                    {errors.baseUrl && touched.baseUrl && (
                      <div className="text-red-500 mt-2">{errors.baseUrl}</div>
                    )}
                  </div>
                </div>
                <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800 sm:pt-5">
                  <label
                    htmlFor="activeProfileId"
                    className="block text-sm font-medium leading-5 text-cool-gray-400 sm:mt-px sm:pt-2"
                  >
                    Quality Profile
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <div className="max-w-lg flex rounded-md shadow-sm">
                      <Field
                        as="select"
                        id="activeProfileId"
                        name="activeProfileId"
                        className="mt-1 form-select block w-full pl-3 pr-10 py-2 text-base leading-6 bg-cool-gray-700 border-cool-gray-500 focus:outline-none focus:shadow-outline-blue focus:border-cool-gray-500 sm:text-sm sm:leading-5"
                      >
                        <option value="">Select a Quality Profile</option>
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
                      <div className="text-red-500 mt-2">
                        {errors.activeProfileId}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800 sm:pt-5">
                  <label
                    htmlFor="rootFolder"
                    className="block text-sm font-medium leading-5 text-cool-gray-400 sm:mt-px sm:pt-2"
                  >
                    Root Folder
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <div className="max-w-lg flex rounded-md shadow-sm">
                      <Field
                        as="select"
                        id="rootFolder"
                        name="rootFolder"
                        className="mt-1 form-select block w-full pl-3 pr-10 py-2 text-base leading-6 bg-cool-gray-700 border-cool-gray-500 focus:outline-none focus:shadow-outline-blue focus:border-cool-gray-500 sm:text-sm sm:leading-5"
                      >
                        <option value="">Select a Root Folder</option>
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
                      <div className="text-red-500 mt-2">
                        {errors.rootFolder}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
                  <label
                    htmlFor="is4k"
                    className="block text-sm font-medium leading-5 text-cool-gray-400 sm:mt-px sm:pt-2"
                  >
                    Ultra HD Server
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <Field
                      type="checkbox"
                      id="is4k"
                      name="is4k"
                      className="form-checkbox h-6 w-6 text-indigo-600 transition duration-150 ease-in-out"
                    />
                  </div>
                </div>
                <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
                  <label
                    htmlFor="enableSeasonFolders"
                    className="block text-sm font-medium leading-5 text-cool-gray-400 sm:mt-px sm:pt-2"
                  >
                    Season Folders
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <Field
                      type="checkbox"
                      id="enableSeasonFolders"
                      name="enableSeasonFolders"
                      className="form-checkbox h-6 w-6 text-indigo-600 transition duration-150 ease-in-out"
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

export default SonarrModal;
