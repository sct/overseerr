import { SaveIcon } from '@heroicons/react/outline';
import { RefreshIcon, SearchIcon, XIcon } from '@heroicons/react/solid';
import axios from 'axios';
import { Field, Formik } from 'formik';
import { orderBy } from 'lodash';
import React, { useMemo, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';
import * as Yup from 'yup';
import type { PlexDevice } from '../../../server/interfaces/api/plexInterfaces';
import type {
  PlexSettings,
  TautulliSettings,
} from '../../../server/lib/settings';
import globalMessages from '../../i18n/globalMessages';
import Alert from '../Common/Alert';
import Badge from '../Common/Badge';
import Button from '../Common/Button';
import LoadingSpinner from '../Common/LoadingSpinner';
import PageTitle from '../Common/PageTitle';
import SensitiveInput from '../Common/SensitiveInput';
import LibraryItem from './LibraryItem';

const messages = defineMessages({
  plex: 'Plex',
  plexsettings: 'Plex Settings',
  plexsettingsDescription:
    'Configure the settings for your Plex server. Overseerr scans your Plex libraries to determine content availability.',
  serverpreset: 'Server',
  serverLocal: 'local',
  serverRemote: 'remote',
  serverSecure: 'secure',
  serverpresetManualMessage: 'Manual configuration',
  serverpresetRefreshing: 'Retrieving servers…',
  serverpresetLoad: 'Press the button to load available servers',
  toastPlexRefresh: 'Retrieving server list from Plex…',
  toastPlexRefreshSuccess: 'Plex server list retrieved successfully!',
  toastPlexRefreshFailure: 'Failed to retrieve Plex server list.',
  toastPlexConnecting: 'Attempting to connect to Plex…',
  toastPlexConnectingSuccess: 'Plex connection established successfully!',
  toastPlexConnectingFailure: 'Failed to connect to Plex.',
  settingUpPlexDescription:
    'To set up Plex, you can either enter the details manually or select a server retrieved from <RegisterPlexTVLink>plex.tv</RegisterPlexTVLink>. Press the button to the right of the dropdown to fetch the list of available servers.',
  hostname: 'Hostname or IP Address',
  port: 'Port',
  enablessl: 'Use SSL',
  plexlibraries: 'Plex Libraries',
  plexlibrariesDescription:
    'The libraries Overseerr scans for titles. Set up and save your Plex connection settings, then click the button below if no libraries are listed.',
  scanning: 'Syncing…',
  scan: 'Sync Libraries',
  manualscan: 'Manual Library Scan',
  manualscanDescription:
    "Normally, this will only be run once every 24 hours. Overseerr will check your Plex server's recently added more aggressively. If this is your first time configuring Plex, a one-time full manual library scan is recommended!",
  notrunning: 'Not Running',
  currentlibrary: 'Current Library: {name}',
  librariesRemaining: 'Libraries Remaining: {count}',
  startscan: 'Start Scan',
  cancelscan: 'Cancel Scan',
  validationHostnameRequired: 'You must provide a valid hostname or IP address',
  validationPortRequired: 'You must provide a valid port number',
  webAppUrl: '<WebAppLink>Web App</WebAppLink> URL',
  webAppUrlTip:
    'Optionally direct users to the web app on your server instead of the "hosted" web app',
  tautulliSettings: 'Tautulli Settings',
  tautulliSettingsDescription:
    'Optionally configure the settings for your Tautulli server. Overseerr fetches watch history data for your Plex media from Tautulli.',
  urlBase: 'URL Base',
  tautulliApiKey: 'API Key',
  externalUrl: 'External URL',
  validationApiKey: 'You must provide an API key',
  validationUrl: 'You must provide a valid URL',
  validationUrlTrailingSlash: 'URL must not end in a trailing slash',
  validationUrlBaseLeadingSlash: 'URL base must have a leading slash',
  validationUrlBaseTrailingSlash: 'URL base must not end in a trailing slash',
  toastTautulliSettingsSuccess: 'Tautulli settings saved successfully!',
  toastTautulliSettingsFailure:
    'Something went wrong while saving Tautulli settings.',
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
  currentLibrary?: Library;
  libraries: Library[];
}

interface PresetServerDisplay {
  name: string;
  ssl: boolean;
  uri: string;
  address: string;
  port: number;
  local: boolean;
  status?: boolean;
  message?: string;
}
interface SettingsPlexProps {
  onComplete?: () => void;
}

const SettingsPlex: React.FC<SettingsPlexProps> = ({ onComplete }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRefreshingPresets, setIsRefreshingPresets] = useState(false);
  const [availableServers, setAvailableServers] = useState<PlexDevice[] | null>(
    null
  );
  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR<PlexSettings>('/api/v1/settings/plex');
  const { data: dataTautulli, mutate: revalidateTautulli } =
    useSWR<TautulliSettings>('/api/v1/settings/tautulli');
  const { data: dataSync, mutate: revalidateSync } = useSWR<SyncStatus>(
    '/api/v1/settings/plex/sync',
    {
      refreshInterval: 1000,
    }
  );
  const intl = useIntl();
  const { addToast, removeToast } = useToasts();

  const PlexSettingsSchema = Yup.object().shape({
    hostname: Yup.string()
      .nullable()
      .required(intl.formatMessage(messages.validationHostnameRequired))
      .matches(
        /^(((([a-z]|\d|_|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*)?([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])):((([a-z]|\d|_|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*)?([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))@)?(([a-z]|\d|_|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*)?([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])$/i,
        intl.formatMessage(messages.validationHostnameRequired)
      ),
    port: Yup.number()
      .nullable()
      .required(intl.formatMessage(messages.validationPortRequired)),
    webAppUrl: Yup.string()
      .nullable()
      .url(intl.formatMessage(messages.validationUrl)),
  });

  const TautulliSettingsSchema = Yup.object().shape(
    {
      tautulliHostname: Yup.string()
        .when(['tautulliPort', 'tautulliApiKey'], {
          is: (value: unknown) => !!value,
          then: Yup.string()
            .nullable()
            .required(intl.formatMessage(messages.validationHostnameRequired)),
          otherwise: Yup.string().nullable(),
        })
        .matches(
          /^(([a-z]|\d|_|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*)?([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])$/i,
          intl.formatMessage(messages.validationHostnameRequired)
        ),
      tautulliPort: Yup.number().when(['tautulliHostname', 'tautulliApiKey'], {
        is: (value: unknown) => !!value,
        then: Yup.number()
          .typeError(intl.formatMessage(messages.validationPortRequired))
          .nullable()
          .required(intl.formatMessage(messages.validationPortRequired)),
        otherwise: Yup.number()
          .typeError(intl.formatMessage(messages.validationPortRequired))
          .nullable(),
      }),
      tautulliUrlBase: Yup.string()
        .test(
          'leading-slash',
          intl.formatMessage(messages.validationUrlBaseLeadingSlash),
          (value) => !value || value.startsWith('/')
        )
        .test(
          'no-trailing-slash',
          intl.formatMessage(messages.validationUrlBaseTrailingSlash),
          (value) => !value || !value.endsWith('/')
        ),
      tautulliApiKey: Yup.string().when(['tautulliHostname', 'tautulliPort'], {
        is: (value: unknown) => !!value,
        then: Yup.string()
          .nullable()
          .required(intl.formatMessage(messages.validationApiKey)),
        otherwise: Yup.string().nullable(),
      }),
      tautulliExternalUrl: Yup.string()
        .url(intl.formatMessage(messages.validationUrl))
        .test(
          'no-trailing-slash',
          intl.formatMessage(messages.validationUrlTrailingSlash),
          (value) => !value || !value.endsWith('/')
        ),
    },
    [
      ['tautulliHostname', 'tautulliPort'],
      ['tautulliHostname', 'tautulliApiKey'],
      ['tautulliPort', 'tautulliApiKey'],
    ]
  );

  const activeLibraries =
    data?.libraries
      .filter((library) => library.enabled)
      .map((library) => library.id) ?? [];

  const availablePresets = useMemo(() => {
    const finalPresets: PresetServerDisplay[] = [];
    availableServers?.forEach((dev) => {
      dev.connection.forEach((conn) =>
        finalPresets.push({
          name: dev.name,
          ssl: conn.protocol === 'https',
          uri: conn.uri,
          address: conn.address,
          port: conn.port,
          local: conn.local,
          status: conn.status === 200,
          message: conn.message,
        })
      );
    });

    return orderBy(finalPresets, ['status', 'ssl'], ['desc', 'desc']);
  }, [availableServers]);

  const syncLibraries = async () => {
    setIsSyncing(true);

    const params: { sync: boolean; enable?: string } = {
      sync: true,
    };

    if (activeLibraries.length > 0) {
      params.enable = activeLibraries.join(',');
    }

    await axios.get('/api/v1/settings/plex/library', {
      params,
    });
    setIsSyncing(false);
    revalidate();
  };

  const refreshPresetServers = async () => {
    setIsRefreshingPresets(true);
    let toastId: string | undefined;
    try {
      addToast(
        intl.formatMessage(messages.toastPlexRefresh),
        {
          autoDismiss: false,
          appearance: 'info',
        },
        (id) => {
          toastId = id;
        }
      );
      const response = await axios.get<PlexDevice[]>(
        '/api/v1/settings/plex/devices/servers'
      );
      if (response.data) {
        setAvailableServers(response.data);
      }
      if (toastId) {
        removeToast(toastId);
      }
      addToast(intl.formatMessage(messages.toastPlexRefreshSuccess), {
        autoDismiss: true,
        appearance: 'success',
      });
    } catch (e) {
      if (toastId) {
        removeToast(toastId);
      }
      addToast(intl.formatMessage(messages.toastPlexRefreshFailure), {
        autoDismiss: true,
        appearance: 'error',
      });
    } finally {
      setIsRefreshingPresets(false);
    }
  };

  const startScan = async () => {
    await axios.post('/api/v1/settings/plex/sync', {
      start: true,
    });
    revalidateSync();
  };

  const cancelScan = async () => {
    await axios.post('/api/v1/settings/plex/sync', {
      cancel: true,
    });
    revalidateSync();
  };

  const toggleLibrary = async (libraryId: string) => {
    setIsSyncing(true);
    if (activeLibraries.includes(libraryId)) {
      const params: { enable?: string } = {};

      if (activeLibraries.length > 1) {
        params.enable = activeLibraries
          .filter((id) => id !== libraryId)
          .join(',');
      }

      await axios.get('/api/v1/settings/plex/library', {
        params,
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

  if ((!data || !dataTautulli) && !error) {
    return <LoadingSpinner />;
  }
  return (
    <>
      <PageTitle
        title={[
          intl.formatMessage(messages.plex),
          intl.formatMessage(globalMessages.settings),
        ]}
      />
      <div className="mb-6">
        <h3 className="heading">{intl.formatMessage(messages.plexsettings)}</h3>
        <p className="description">
          {intl.formatMessage(messages.plexsettingsDescription)}
        </p>
        {!!onComplete && (
          <div className="section">
            <Alert
              title={intl.formatMessage(messages.settingUpPlexDescription, {
                RegisterPlexTVLink: function RegisterPlexTVLink(msg) {
                  return (
                    <a
                      href="https://plex.tv"
                      className="text-white transition duration-300 hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {msg}
                    </a>
                  );
                },
              })}
              type="info"
            />
          </div>
        )}
      </div>
      <Formik
        initialValues={{
          hostname: data?.ip,
          port: data?.port ?? 32400,
          useSsl: data?.useSsl,
          selectedPreset: undefined,
          webAppUrl: data?.webAppUrl,
        }}
        validationSchema={PlexSettingsSchema}
        onSubmit={async (values) => {
          let toastId: string | null = null;
          try {
            addToast(
              intl.formatMessage(messages.toastPlexConnecting),
              {
                autoDismiss: false,
                appearance: 'info',
              },
              (id) => {
                toastId = id;
              }
            );
            await axios.post('/api/v1/settings/plex', {
              ip: values.hostname,
              port: Number(values.port),
              useSsl: values.useSsl,
              webAppUrl: values.webAppUrl,
            } as PlexSettings);

            syncLibraries();

            if (toastId) {
              removeToast(toastId);
            }
            addToast(intl.formatMessage(messages.toastPlexConnectingSuccess), {
              autoDismiss: true,
              appearance: 'success',
            });

            if (onComplete) {
              onComplete();
            }
          } catch (e) {
            if (toastId) {
              removeToast(toastId);
            }
            addToast(intl.formatMessage(messages.toastPlexConnectingFailure), {
              autoDismiss: true,
              appearance: 'error',
            });
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
            <form className="section" onSubmit={handleSubmit}>
              <div className="form-row">
                <label htmlFor="preset" className="text-label">
                  {intl.formatMessage(messages.serverpreset)}
                </label>
                <div className="form-input-area">
                  <div className="form-input-field">
                    <select
                      id="preset"
                      name="preset"
                      value={values.selectedPreset}
                      disabled={!availableServers || isRefreshingPresets}
                      className="rounded-l-only"
                      onChange={async (e) => {
                        const targPreset =
                          availablePresets[Number(e.target.value)];

                        if (targPreset) {
                          setFieldValue('hostname', targPreset.address);
                          setFieldValue('port', targPreset.port);
                          setFieldValue('useSsl', targPreset.ssl);
                        }
                      }}
                    >
                      <option value="manual">
                        {availableServers || isRefreshingPresets
                          ? isRefreshingPresets
                            ? intl.formatMessage(
                                messages.serverpresetRefreshing
                              )
                            : intl.formatMessage(
                                messages.serverpresetManualMessage
                              )
                          : intl.formatMessage(messages.serverpresetLoad)}
                      </option>
                      {availablePresets.map((server, index) => (
                        <option
                          key={`preset-server-${index}`}
                          value={index}
                          disabled={!server.status}
                        >
                          {`
                            ${server.name} (${server.address})
                            [${
                              server.local
                                ? intl.formatMessage(messages.serverLocal)
                                : intl.formatMessage(messages.serverRemote)
                            }]${
                            server.ssl
                              ? ` [${intl.formatMessage(
                                  messages.serverSecure
                                )}]`
                              : ''
                          }
                            ${server.status ? '' : '(' + server.message + ')'}
                          `}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        refreshPresetServers();
                      }}
                      className="input-action"
                    >
                      <RefreshIcon
                        className={isRefreshingPresets ? 'animate-spin' : ''}
                        style={{ animationDirection: 'reverse' }}
                      />
                    </button>
                  </div>
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="hostname" className="text-label">
                  {intl.formatMessage(messages.hostname)}
                  <span className="label-required">*</span>
                </label>
                <div className="form-input-area">
                  <div className="form-input-field">
                    <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-gray-500 bg-gray-800 px-3 text-gray-100 sm:text-sm">
                      {values.useSsl ? 'https://' : 'http://'}
                    </span>
                    <Field
                      type="text"
                      inputMode="url"
                      id="hostname"
                      name="hostname"
                      className="rounded-r-only"
                    />
                  </div>
                  {errors.hostname && touched.hostname && (
                    <div className="error">{errors.hostname}</div>
                  )}
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="port" className="text-label">
                  {intl.formatMessage(messages.port)}
                  <span className="label-required">*</span>
                </label>
                <div className="form-input-area">
                  <Field
                    type="text"
                    inputMode="numeric"
                    id="port"
                    name="port"
                    className="short"
                  />
                  {errors.port && touched.port && (
                    <div className="error">{errors.port}</div>
                  )}
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="ssl" className="checkbox-label">
                  {intl.formatMessage(messages.enablessl)}
                </label>
                <div className="form-input-area">
                  <Field
                    type="checkbox"
                    id="useSsl"
                    name="useSsl"
                    onChange={() => {
                      setFieldValue('useSsl', !values.useSsl);
                    }}
                  />
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="webAppUrl" className="text-label">
                  {intl.formatMessage(messages.webAppUrl, {
                    WebAppLink: function WebAppLink(msg) {
                      return (
                        <a
                          href="https://support.plex.tv/articles/200288666-opening-plex-web-app/"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {msg}
                        </a>
                      );
                    },
                  })}
                  <Badge badgeType="danger" className="ml-2">
                    {intl.formatMessage(globalMessages.advanced)}
                  </Badge>
                  <span className="label-tip">
                    {intl.formatMessage(messages.webAppUrlTip)}
                  </span>
                </label>
                <div className="form-input-area">
                  <div className="form-input-field">
                    <Field
                      type="text"
                      inputMode="url"
                      id="webAppUrl"
                      name="webAppUrl"
                      placeholder="https://app.plex.tv/desktop"
                    />
                  </div>
                  {errors.webAppUrl && touched.webAppUrl && (
                    <div className="error">{errors.webAppUrl}</div>
                  )}
                </div>
              </div>
              <div className="actions">
                <div className="flex justify-end">
                  <span className="ml-3 inline-flex rounded-md shadow-sm">
                    <Button
                      buttonType="primary"
                      type="submit"
                      disabled={isSubmitting || !isValid}
                    >
                      <SaveIcon />
                      <span>
                        {isSubmitting
                          ? intl.formatMessage(globalMessages.saving)
                          : intl.formatMessage(globalMessages.save)}
                      </span>
                    </Button>
                  </span>
                </div>
              </div>
            </form>
          );
        }}
      </Formik>
      <div className="mt-10 mb-6">
        <h3 className="heading">
          {intl.formatMessage(messages.plexlibraries)}
        </h3>
        <p className="description">
          {intl.formatMessage(messages.plexlibrariesDescription)}
        </p>
      </div>
      <div className="section">
        <Button
          onClick={() => syncLibraries()}
          disabled={isSyncing || !data?.ip || !data?.port}
        >
          <RefreshIcon
            className={isSyncing ? 'animate-spin' : ''}
            style={{ animationDirection: 'reverse' }}
          />
          <span>
            {isSyncing
              ? intl.formatMessage(messages.scanning)
              : intl.formatMessage(messages.scan)}
          </span>
        </Button>
        <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
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
      <div className="mt-10 mb-6">
        <h3 className="heading">{intl.formatMessage(messages.manualscan)}</h3>
        <p className="description">
          {intl.formatMessage(messages.manualscanDescription)}
        </p>
      </div>
      <div className="section">
        <div className="rounded-md bg-gray-800 p-4">
          <div className="relative mb-6 h-8 w-full overflow-hidden rounded-full bg-gray-600">
            {dataSync?.running && (
              <div
                className="h-8 bg-indigo-600 transition-all duration-200 ease-in-out"
                style={{
                  width: `${Math.round(
                    (dataSync.progress / dataSync.total) * 100
                  )}%`,
                }}
              />
            )}
            <div className="absolute inset-0 flex h-8 w-full items-center justify-center text-sm">
              <span>
                {dataSync?.running
                  ? `${dataSync.progress} of ${dataSync.total}`
                  : 'Not running'}
              </span>
            </div>
          </div>
          <div className="flex w-full flex-col sm:flex-row">
            {dataSync?.running && (
              <>
                {dataSync.currentLibrary && (
                  <div className="mb-2 mr-0 flex items-center sm:mb-0 sm:mr-2">
                    <Badge>
                      {intl.formatMessage(messages.currentlibrary, {
                        name: dataSync.currentLibrary.name,
                      })}
                    </Badge>
                  </div>
                )}
                <div className="flex items-center">
                  <Badge badgeType="warning">
                    {intl.formatMessage(messages.librariesRemaining, {
                      count: dataSync.currentLibrary
                        ? dataSync.libraries.slice(
                            dataSync.libraries.findIndex(
                              (library) =>
                                library.id === dataSync.currentLibrary?.id
                            ) + 1
                          ).length
                        : 0,
                    })}
                  </Badge>
                </div>
              </>
            )}
            <div className="flex-1 text-right">
              {!dataSync?.running ? (
                <Button
                  buttonType="warning"
                  onClick={() => startScan()}
                  disabled={isSyncing || !activeLibraries.length}
                >
                  <SearchIcon />
                  <span>{intl.formatMessage(messages.startscan)}</span>
                </Button>
              ) : (
                <Button buttonType="danger" onClick={() => cancelScan()}>
                  <XIcon />
                  <span>{intl.formatMessage(messages.cancelscan)}</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      {!onComplete && (
        <>
          <div className="mt-10 mb-6">
            <h3 className="heading">
              {intl.formatMessage(messages.tautulliSettings)}
            </h3>
            <p className="description">
              {intl.formatMessage(messages.tautulliSettingsDescription)}
            </p>
          </div>
          <Formik
            initialValues={{
              tautulliHostname: dataTautulli?.hostname,
              tautulliPort: dataTautulli?.port ?? 8181,
              tautulliUseSsl: dataTautulli?.useSsl,
              tautulliUrlBase: dataTautulli?.urlBase,
              tautulliApiKey: dataTautulli?.apiKey,
              tautulliExternalUrl: dataTautulli?.externalUrl,
            }}
            validationSchema={TautulliSettingsSchema}
            onSubmit={async (values) => {
              try {
                await axios.post('/api/v1/settings/tautulli', {
                  hostname: values.tautulliHostname,
                  port: Number(values.tautulliPort),
                  useSsl: values.tautulliUseSsl,
                  urlBase: values.tautulliUrlBase,
                  apiKey: values.tautulliApiKey,
                  externalUrl: values.tautulliExternalUrl,
                } as TautulliSettings);

                addToast(
                  intl.formatMessage(messages.toastTautulliSettingsSuccess),
                  {
                    autoDismiss: true,
                    appearance: 'success',
                  }
                );
              } catch (e) {
                addToast(
                  intl.formatMessage(messages.toastTautulliSettingsFailure),
                  {
                    autoDismiss: true,
                    appearance: 'error',
                  }
                );
              } finally {
                revalidateTautulli();
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
                <form className="section" onSubmit={handleSubmit}>
                  <div className="form-row">
                    <label htmlFor="tautulliHostname" className="text-label">
                      {intl.formatMessage(messages.hostname)}
                      <span className="label-required">*</span>
                    </label>
                    <div className="form-input-area">
                      <div className="form-input-field">
                        <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-gray-500 bg-gray-800 px-3 text-gray-100 sm:text-sm">
                          {values.tautulliUseSsl ? 'https://' : 'http://'}
                        </span>
                        <Field
                          type="text"
                          inputMode="url"
                          id="tautulliHostname"
                          name="tautulliHostname"
                          className="rounded-r-only"
                        />
                      </div>
                      {errors.tautulliHostname && touched.tautulliHostname && (
                        <div className="error">{errors.tautulliHostname}</div>
                      )}
                    </div>
                  </div>
                  <div className="form-row">
                    <label htmlFor="tautulliPort" className="text-label">
                      {intl.formatMessage(messages.port)}
                      <span className="label-required">*</span>
                    </label>
                    <div className="form-input-area">
                      <Field
                        type="text"
                        inputMode="numeric"
                        id="tautulliPort"
                        name="tautulliPort"
                        className="short"
                      />
                      {errors.tautulliPort && touched.tautulliPort && (
                        <div className="error">{errors.tautulliPort}</div>
                      )}
                    </div>
                  </div>
                  <div className="form-row">
                    <label htmlFor="tautulliUseSsl" className="checkbox-label">
                      {intl.formatMessage(messages.enablessl)}
                    </label>
                    <div className="form-input-area">
                      <Field
                        type="checkbox"
                        id="tautulliUseSsl"
                        name="tautulliUseSsl"
                        onChange={() => {
                          setFieldValue(
                            'tautulliUseSsl',
                            !values.tautulliUseSsl
                          );
                        }}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <label htmlFor="tautulliUrlBase" className="text-label">
                      {intl.formatMessage(messages.urlBase)}
                    </label>
                    <div className="form-input-area">
                      <div className="form-input-field">
                        <Field
                          type="text"
                          inputMode="url"
                          id="tautulliUrlBase"
                          name="tautulliUrlBase"
                        />
                      </div>
                      {errors.tautulliUrlBase && touched.tautulliUrlBase && (
                        <div className="error">{errors.tautulliUrlBase}</div>
                      )}
                    </div>
                  </div>
                  <div className="form-row">
                    <label htmlFor="tautulliApiKey" className="text-label">
                      {intl.formatMessage(messages.tautulliApiKey)}
                      <span className="label-required">*</span>
                    </label>
                    <div className="form-input-area">
                      <div className="form-input-field">
                        <SensitiveInput
                          as="field"
                          id="tautulliApiKey"
                          name="tautulliApiKey"
                          autoComplete="one-time-code"
                        />
                      </div>
                      {errors.tautulliApiKey && touched.tautulliApiKey && (
                        <div className="error">{errors.tautulliApiKey}</div>
                      )}
                    </div>
                  </div>
                  <div className="form-row">
                    <label htmlFor="tautulliExternalUrl" className="text-label">
                      {intl.formatMessage(messages.externalUrl)}
                    </label>
                    <div className="form-input-area">
                      <div className="form-input-field">
                        <Field
                          type="text"
                          inputMode="url"
                          id="tautulliExternalUrl"
                          name="tautulliExternalUrl"
                        />
                      </div>
                      {errors.tautulliExternalUrl &&
                        touched.tautulliExternalUrl && (
                          <div className="error">
                            {errors.tautulliExternalUrl}
                          </div>
                        )}
                    </div>
                  </div>
                  <div className="actions">
                    <div className="flex justify-end">
                      <span className="ml-3 inline-flex rounded-md shadow-sm">
                        <Button
                          buttonType="primary"
                          type="submit"
                          disabled={isSubmitting || !isValid}
                        >
                          <SaveIcon />
                          <span>
                            {isSubmitting
                              ? intl.formatMessage(globalMessages.saving)
                              : intl.formatMessage(globalMessages.save)}
                          </span>
                        </Button>
                      </span>
                    </div>
                  </div>
                </form>
              );
            }}
          </Formik>
        </>
      )}
    </>
  );
};

export default SettingsPlex;
