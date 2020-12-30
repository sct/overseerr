import React, { useState } from 'react';
import LoadingSpinner from '../Common/LoadingSpinner';
import type { PlexSettings } from '../../../server/lib/settings';
import useSWR from 'swr';
import { Formik, Field } from 'formik';
import Button from '../Common/Button';
import axios from 'axios';
import LibraryItem from './LibraryItem';
import Badge from '../Common/Badge';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import * as Yup from 'yup';

const messages = defineMessages({
  plexsettings: 'Plex Settings',
  plexsettingsDescription:
    'Configure the settings for your Plex server. Overseerr uses your Plex server to scan your library at an interval and see what content is available.',
  servername: 'Server Name (Automatically set after you save)',
  servernamePlaceholder: 'Plex Server Name',
  hostname: 'Hostname/IP',
  port: 'Port',
  ssl: 'SSL',
  save: 'Save Changes',
  saving: 'Saving...',
  plexlibraries: 'Plex Libraries',
  plexlibrariesDescription:
    'These are the libraries Overseerr will scan for titles. If you see no libraries listed, you will need to run at least one sync by clicking the button below. You must first configure and save your plex connection settings before you will be able to retrieve your libraries.',
  syncing: 'Syncing',
  sync: 'Sync Plex Libraries',
  manualscan: 'Manual Library Scan',
  manualscanDescription:
    "Normally, this will only be run once every 24 hours. Overseerr will check your Plex server's recently added more aggressively. If this is your first time configuring Plex, a one time full manual library scan is recommended!",
  notrunning: 'Not Running',
  currentlibrary: 'Current Library: {name}',
  librariesRemaining: 'Libraries Remaining: {count}',
  startscan: 'Start Scan',
  cancelscan: 'Cancel Scan',
  validationHostnameRequired: 'You must provide a hostname/IP',
  validationPortRequired: 'You must provide a port',
});

interface Library {
  id: string;
  name: string;
  enabled: boolean;
}

interface SyncStatus {
  running: boolean;
  progress: number;
  total: number;
  currentLibrary: Library;
  libraries: Library[];
}

interface SettingsPlexProps {
  onComplete?: () => void;
}

const SettingsPlex: React.FC<SettingsPlexProps> = ({ onComplete }) => {
  const intl = useIntl();
  const { data, error, revalidate } = useSWR<PlexSettings>(
    '/api/v1/settings/plex'
  );
  const { data: dataSync, revalidate: revalidateSync } = useSWR<SyncStatus>(
    '/api/v1/settings/plex/sync',
    {
      refreshInterval: 1000,
    }
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const PlexSettingsSchema = Yup.object().shape({
    hostname: Yup.string().required(
      intl.formatMessage(messages.validationHostnameRequired)
    ),
    port: Yup.number().required(
      intl.formatMessage(messages.validationPortRequired)
    ),
  });

  const activeLibraries =
    data?.libraries
      .filter((library) => library.enabled)
      .map((library) => library.id) ?? [];

  const syncLibraries = async () => {
    setIsSyncing(true);
    await axios.get('/api/v1/settings/plex/library', {
      params: {
        sync: true,
        enable:
          activeLibraries.length > 0 ? activeLibraries.join(',') : undefined,
      },
    });
    setIsSyncing(false);
    revalidate();
  };

  const startScan = async () => {
    await axios.get('/api/v1/settings/plex/sync', {
      params: {
        start: true,
      },
    });
    revalidateSync();
  };

  const cancelScan = async () => {
    await axios.get('/api/v1/settings/plex/sync', {
      params: {
        cancel: true,
      },
    });
    revalidateSync();
  };

  const toggleLibrary = async (libraryId: string) => {
    setIsSyncing(true);
    if (activeLibraries.includes(libraryId)) {
      await axios.get('/api/v1/settings/plex/library', {
        params: {
          enable:
            activeLibraries.length > 0
              ? activeLibraries.filter((id) => id !== libraryId).join(',')
              : undefined,
        },
      });
    } else {
      await axios.get('/api/v1/settings/plex/library', {
        params: {
          enable: [...activeLibraries, libraryId].join(','),
        },
      });
    }
    setIsSyncing(false);
    revalidate();
  };

  if (!data && !error) {
    return <LoadingSpinner />;
  }
  return (
    <>
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-200">
          <FormattedMessage {...messages.plexsettings} />
        </h3>
        <p className="max-w-2xl mt-1 text-sm leading-5 text-gray-500">
          <FormattedMessage {...messages.plexsettingsDescription} />
        </p>
      </div>
      <Formik
        initialValues={{
          hostname: data?.ip,
          port: data?.port,
          useSsl: data?.useSsl,
        }}
        enableReinitialize
        validationSchema={PlexSettingsSchema}
        onSubmit={async (values) => {
          setSubmitError(null);
          try {
            await axios.post('/api/v1/settings/plex', {
              ip: values.hostname,
              port: Number(values.port),
              useSsl: values.useSsl,
            } as PlexSettings);

            revalidate();
            if (onComplete) {
              onComplete();
            }
          } catch (e) {
            setSubmitError(e.response.data.message);
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
            <form onSubmit={handleSubmit}>
              <div className="mt-6 sm:mt-5">
                {submitError && (
                  <div className="p-4 mb-6 text-white bg-red-700 rounded-md">
                    {submitError}
                  </div>
                )}
                <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800">
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px"
                  >
                    <FormattedMessage {...messages.servername} />
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <div className="flex max-w-lg rounded-md shadow-sm">
                      <input
                        type="text"
                        id="name"
                        name="name"
                        placeholder={intl.formatMessage(
                          messages.servernamePlaceholder
                        )}
                        value={data?.name}
                        readOnly
                        className="flex-1 block w-full min-w-0 transition duration-150 ease-in-out bg-gray-700 border border-gray-500 rounded-md form-input sm:text-sm sm:leading-5"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800">
                  <label
                    htmlFor="hostname"
                    className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px"
                  >
                    <FormattedMessage {...messages.hostname} />
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <div className="flex max-w-lg rounded-md shadow-sm">
                      <span className="inline-flex items-center px-3 text-gray-100 bg-gray-800 border border-r-0 border-gray-500 cursor-default rounded-l-md sm:text-sm">
                        {values.useSsl ? 'https://' : 'http://'}
                      </span>
                      <Field
                        type="text"
                        id="hostname"
                        name="hostname"
                        placeholder="127.0.0.1"
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
                    <FormattedMessage {...messages.port} />
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <div className="max-w-lg rounded-md shadow-sm sm:max-w-xs">
                      <Field
                        type="text"
                        id="port"
                        name="port"
                        placeholder="32400"
                        className="block w-24 transition duration-150 ease-in-out bg-gray-700 border border-gray-500 rounded-md form-input sm:text-sm sm:leading-5"
                      />
                    </div>
                    {errors.port && touched.port && (
                      <div className="mt-2 text-red-500">{errors.port}</div>
                    )}
                  </div>
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
                    id="useSsl"
                    name="useSsl"
                    onChange={() => {
                      setFieldValue('useSsl', !values.useSsl);
                    }}
                    className="w-6 h-6 text-indigo-600 transition duration-150 ease-in-out rounded-md form-checkbox"
                  />
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
            </form>
          );
        }}
      </Formik>
      <div className="mt-10">
        <h3 className="text-lg font-medium leading-6 text-gray-200">
          <FormattedMessage {...messages.plexlibraries} />
        </h3>
        <p className="max-w-2xl mt-1 text-sm leading-5 text-gray-500">
          <FormattedMessage {...messages.plexlibrariesDescription} />
        </p>
        <div className="mt-6">
          <Button onClick={() => syncLibraries()} disabled={isSyncing}>
            <svg
              className={`${isSyncing ? 'animate-spin' : ''} w-5 h-5 mr-1`}
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
            {isSyncing
              ? intl.formatMessage(messages.syncing)
              : intl.formatMessage(messages.sync)}
          </Button>
        </div>
        <ul className="grid grid-cols-1 gap-5 mt-6 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {data?.libraries.map((library) => (
            <LibraryItem
              name={library.name}
              isEnabled={library.enabled}
              key={`setting-library-${library.id}`}
              onToggle={() => toggleLibrary(library.id)}
            />
          ))}
        </ul>
      </div>
      <div className="mt-10">
        <h3 className="text-lg font-medium leading-6 text-gray-200">
          <FormattedMessage {...messages.manualscan} />
        </h3>
        <p className="max-w-2xl mt-1 text-sm leading-5 text-gray-500">
          <FormattedMessage {...messages.manualscanDescription} />
        </p>
        <div className="mt-6">
          <div className="p-4 bg-gray-800 rounded-md">
            <div className="relative w-full h-8 mb-6 overflow-hidden bg-gray-600 rounded-full">
              {dataSync?.running && (
                <div
                  className="h-8 transition-all duration-200 ease-in-out bg-indigo-600"
                  style={{
                    width: `${Math.round(
                      (dataSync.progress / dataSync.total) * 100
                    )}%`,
                  }}
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center w-full h-8 text-sm">
                <span>
                  {dataSync?.running
                    ? `${dataSync.progress} of ${dataSync.total}`
                    : 'Not running'}
                </span>
              </div>
            </div>
            <div className="flex flex-col w-full sm:flex-row">
              {dataSync?.running && (
                <>
                  <div className="flex items-center mb-2 mr-0 sm:mb-0 sm:mr-2">
                    <Badge>
                      <FormattedMessage
                        {...messages.currentlibrary}
                        values={{ name: dataSync.currentLibrary.name }}
                      />
                    </Badge>
                  </div>
                  <div className="flex items-center">
                    <Badge badgeType="warning">
                      <FormattedMessage
                        {...messages.librariesRemaining}
                        values={{
                          count: dataSync.libraries.slice(
                            dataSync.libraries.findIndex(
                              (library) =>
                                library.id === dataSync.currentLibrary.id
                            ) + 1
                          ).length,
                        }}
                      />
                    </Badge>
                  </div>
                </>
              )}
              <div className="flex-1 text-right">
                {!dataSync?.running && (
                  <Button buttonType="warning" onClick={() => startScan()}>
                    <svg
                      className="w-5 h-5 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <FormattedMessage {...messages.startscan} />
                  </Button>
                )}

                {dataSync?.running && (
                  <Button buttonType="danger" onClick={() => cancelScan()}>
                    <svg
                      className="w-5 h-5 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    <FormattedMessage {...messages.cancelscan} />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPlex;
