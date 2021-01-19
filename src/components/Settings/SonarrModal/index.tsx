import React, { useState, useEffect, useCallback, useRef } from 'react';
import Transition from '../../Transition';
import Modal from '../../Common/Modal';
import { Formik, Field } from 'formik';
import type { SonarrSettings } from '../../../../server/lib/settings';
import * as Yup from 'yup';
import axios from 'axios';
import { useToasts } from 'react-toast-notifications';
import { useIntl, defineMessages } from 'react-intl';

const messages = defineMessages({
  createsonarr: 'Create New Sonarr Server',
  editsonarr: 'Edit Sonarr Server',
  validationNameRequired: 'You must provide a server name',
  validationHostnameRequired: 'You must provide a hostname/IP',
  validationPortRequired: 'You must provide a port',
  validationApiKeyRequired: 'You must provide an API key',
  validationRootFolderRequired: 'You must select a root folder',
  validationProfileRequired: 'You must select a profile',
  toastRadarrTestSuccess: 'Sonarr connection established!',
  toastRadarrTestFailure: 'Failed to connect to Sonarr Server',
  saving: 'Saving...',
  save: 'Save Changes',
  add: 'Add Server',
  test: 'Test',
  testing: 'Testing...',
  defaultserver: 'Default Server',
  servername: 'Server Name',
  servernamePlaceholder: 'A Sonarr Server',
  hostname: 'Hostname',
  port: 'Port',
  ssl: 'SSL',
  apiKey: 'API Key',
  apiKeyPlaceholder: 'Your Sonarr API Key',
  baseUrl: 'Base URL',
  baseUrlPlaceholder: 'Example: /sonarr',
  qualityprofile: 'Quality Profile',
  rootfolder: 'Root Folder',
  animequalityprofile: 'Anime Quality Profile',
  animerootfolder: 'Anime Root Folder',
  seasonfolders: 'Season Folders',
  server4k: '4K Server',
  selectQualityProfile: 'Select a Quality Profile',
  selectRootFolder: 'Select a Root Folder',
  loadingprofiles: 'Loading quality profiles…',
  testFirstQualityProfiles: 'Test your connection to load quality profiles',
  loadingrootfolders: 'Loading root folders…',
  testFirstRootFolders: 'Test your connection to load root folders',
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
  const intl = useIntl();
  const initialLoad = useRef(false);
  const { addToast } = useToasts();
  const [isValidated, setIsValidated] = useState(sonarr ? true : false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResponse, setTestResponse] = useState<TestResponse>({
    profiles: [],
    rootFolders: [],
  });
  const SonarrSettingsSchema = Yup.object().shape({
    name: Yup.string().required(
      intl.formatMessage(messages.validationNameRequired)
    ),
    hostname: Yup.string().required(
      intl.formatMessage(messages.validationHostnameRequired)
    ),
    port: Yup.number().required(
      intl.formatMessage(messages.validationPortRequired)
    ),
    apiKey: Yup.string().required(
      intl.formatMessage(messages.validationApiKeyRequired)
    ),
    rootFolder: Yup.string().required(
      intl.formatMessage(messages.validationRootFolderRequired)
    ),
    activeProfileId: Yup.string().required(
      intl.formatMessage(messages.validationProfileRequired)
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
          '/api/v1/settings/sonarr/test',
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
          activeAnimeProfileId: sonarr?.activeAnimeProfileId,
          activeAnimeRootFolder: sonarr?.activeAnimeDirectory,
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
            const animeProfileName = testResponse.profiles.find(
              (profile) => profile.id === Number(values.activeAnimeProfileId)
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
              activeAnimeProfileId: values.activeAnimeProfileId
                ? Number(values.activeAnimeProfileId)
                : undefined,
              activeAnimeProfileName: animeProfileName ?? undefined,
              activeAnimeDirectory: values.activeAnimeRootFolder,
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
          isValid,
        }) => {
          return (
            <Modal
              onCancel={onClose}
              okButtonType="primary"
              okText={
                isSubmitting
                  ? intl.formatMessage(messages.saving)
                  : sonarr
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
                !sonarr
                  ? intl.formatMessage(messages.createsonarr)
                  : intl.formatMessage(messages.editsonarr)
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
                      placeholder="8989"
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
                <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800">
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
                    htmlFor="activeAnimeProfileId"
                    className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px"
                  >
                    {intl.formatMessage(messages.animequalityprofile)}
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <div className="flex max-w-lg rounded-md shadow-sm">
                      <Field
                        as="select"
                        id="activeAnimeProfileId"
                        name="activeAnimeProfileId"
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
                    {errors.activeAnimeProfileId &&
                      touched.activeAnimeProfileId && (
                        <div className="mt-2 text-red-500">
                          {errors.activeAnimeProfileId}
                        </div>
                      )}
                  </div>
                </div>
                <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800">
                  <label
                    htmlFor="activeAnimeRootFolder"
                    className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px"
                  >
                    {intl.formatMessage(messages.animerootfolder)}
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <div className="flex max-w-lg rounded-md shadow-sm">
                      <Field
                        as="select"
                        id="activeAnimeRootFolder"
                        name="activeAnimeRootFolder"
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
                    {errors.activeAnimeRootFolder &&
                      touched.activeAnimeRootFolder && (
                        <div className="mt-2 text-red-500">
                          {errors.rootFolder}
                        </div>
                      )}
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
                <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200">
                  <label
                    htmlFor="enableSeasonFolders"
                    className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px"
                  >
                    {intl.formatMessage(messages.seasonfolders)}
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <Field
                      type="checkbox"
                      id="enableSeasonFolders"
                      name="enableSeasonFolders"
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

export default SonarrModal;
