import React, { useState, useEffect, useCallback, useRef } from 'react';
import Transition from '../Transition';
import Modal from '../Common/Modal';
import { Formik, Field } from 'formik';
import type { RadarrSettings } from '../../../server/lib/settings';
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
  const initialLoad = useRef(false);
  const { addToast } = useToasts();
  const [isValidated, setIsValidated] = useState(radarr ? true : false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResponse, setTestResponse] = useState<TestResponse>({
    profiles: [],
    rootFolders: [],
  });
  const RadarrSettingsSchema = Yup.object().shape({
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
          '/api/v1/settings/radarr/test',
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
          addToast('Radarr connection established!', {
            appearance: 'success',
            autoDismiss: true,
          });
        }
      } catch (e) {
        setIsValidated(false);
        if (initialLoad.current) {
          addToast('Failed to connect to Radarr server', {
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
          minimumAvailability: radarr?.minimumAvailability,
          isDefault: radarr?.isDefault ?? false,
          is4k: radarr?.is4k ?? false,
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
              port: values.port,
              apiKey: values.apiKey,
              useSsl: values.ssl,
              baseUrl: values.baseUrl,
              activeProfileId: values.activeProfileId,
              activeProfileName: profileName,
              activeDirectory: values.rootFolder,
              is4k: values.is4k,
              minimumAvailability: values.minimumAvailability,
              isDefault: values.isDefault,
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
        }) => {
          return (
            <Modal
              onCancel={onClose}
              okButtonType="primary"
              okText={
                isSubmitting
                  ? 'Saving...'
                  : !!radarr
                  ? 'Save Changes'
                  : 'Add Server'
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
                !radarr ? 'Create New Radarr Server' : 'Edit Radarr Server'
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
                        placeholder="A Radarr Server"
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
                      placeholder="7878"
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
                        placeholder="Your Radarr API Key"
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
                        placeholder="Example: /radarr"
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
                <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800 sm:pt-5">
                  <label
                    htmlFor="minimumAvailability"
                    className="block text-sm font-medium leading-5 text-cool-gray-400 sm:mt-px sm:pt-2"
                  >
                    Minimum Availability
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <div className="max-w-lg flex rounded-md shadow-sm">
                      <Field
                        as="select"
                        id="minimumAvailability"
                        name="minimumAvailability"
                        className="mt-1 form-select block w-full pl-3 pr-10 py-2 text-base leading-6 bg-cool-gray-700 border-cool-gray-500 focus:outline-none focus:shadow-outline-blue focus:border-cool-gray-500 sm:text-sm sm:leading-5"
                      >
                        <option value="announced">Announced</option>
                        <option value="inCinemas">In Cinemas</option>
                        <option value="released">Released</option>
                        <option value="preDB">PreDB</option>
                      </Field>
                    </div>
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
              </div>
            </Modal>
          );
        }}
      </Formik>
    </Transition>
  );
};

export default RadarrModal;
