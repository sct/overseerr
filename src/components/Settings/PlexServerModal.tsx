import Modal from '@app/components/Common/Modal';
import globalMessages from '@app/i18n/globalMessages';
import { ArrowPathIcon } from '@heroicons/react/24/solid';
import type { PlexDevice } from '@server/interfaces/api/plexInterfaces';
import type { PlexSettings } from '@server/lib/settings';
import axios from 'axios';
import { Field, Formik } from 'formik';
import { orderBy } from 'lodash';
import { useMemo, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import * as Yup from 'yup';

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

const messages = defineMessages({
  createplex: 'Add New Plex Server',
  editplex: 'Edit Plex Server',
  validationHostnameRequired: 'You must provide a valid hostname or IP address',
  validationPortRequired: 'You must provide a valid port number',
  toastPlexTestSuccess: 'Plex connection established successfully!',
  toastPlexTestFailure: 'Failed to connect to Plex.',
  toastPlexRefresh: 'Retrieving server list from Plex…',
  toastPlexRefreshSuccess: 'Plex server list retrieved successfully!',
  toastPlexRefreshFailure: 'Failed to retrieve Plex server list.',
  add: 'Add Server',
  servername: 'Server Name',
  hostname: 'Hostname or IP Address',
  port: 'Port',
  ssl: 'Use SSL',
  serverWebAppUrl: 'Web App URL',
  serverWebAppUrlTip:
    'Optionally direct users to the web app on your server instead of the "hosted" web app',
  serverpreset: 'Server',
  serverLocal: 'local',
  serverRemote: 'remote',
  serverSecure: 'secure',
  serverpresetManualMessage: 'Manual configuration',
  serverpresetRefreshing: 'Retrieving servers…',
  serverpresetLoad: 'Press the button to load available servers',
  testConnection: 'Test Connection',
  testing: 'Testing…',
  validationUrl: 'You must provide a valid URL',
  authToken: 'Server Owner Token',
  authTokenTip:
    'Required for servers owned by different Plex accounts. Leave empty to use the admin token.',
  authTokenTipRequired:
    'The Plex authentication token for the owner of this server. Required for additional servers.',
  authTokenPlaceholder: 'Plex authentication token (optional)',
  authTokenPlaceholderRequired: 'Plex authentication token (required)',
  validationAuthTokenRequired: 'Server Owner Token is required for additional servers',
});

interface PlexServerModalProps {
  plex: PlexSettings | null;
  onClose: () => void;
  onSave: () => void;
  isFirstServer?: boolean; // If true, shows server preset dropdown; if false, requires authToken
}

const PlexServerModal = ({ onClose, plex, onSave, isFirstServer = true }: PlexServerModalProps) => {
  const intl = useIntl();
  const { addToast, removeToast } = useToasts();
  const [isTesting, setIsTesting] = useState(false);
  const [isRefreshingPresets, setIsRefreshingPresets] = useState(false);
  const [availableServers, setAvailableServers] = useState<PlexDevice[] | null>(
    null
  );

  const PlexSettingsSchema = Yup.object().shape({
    hostname: Yup.string()
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
    authToken: isFirstServer
      ? Yup.string().nullable()
      : Yup.string().required(
          intl.formatMessage(messages.validationAuthTokenRequired)
        ),
  });

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

  const testConnection = async (values: {
    hostname: string;
    port: number;
    useSsl: boolean;
    authToken?: string;
  }) => {
    setIsTesting(true);
    try {
      await axios.post('/api/v1/settings/plex/test', {
        ip: values.hostname,
        port: Number(values.port),
        useSsl: values.useSsl,
        authToken: values.authToken || undefined,
        id: -1,
        name: '',
        libraries: [],
      } as PlexSettings);

      addToast(intl.formatMessage(messages.toastPlexTestSuccess), {
        appearance: 'success',
        autoDismiss: true,
      });
    } catch (e) {
      const axiosError = e as {
        response?: { status: number; data: unknown };
        message: string;
      };
      const errorMessage =
        axiosError.response?.data &&
        typeof axiosError.response.data === 'object' &&
        'message' in axiosError.response.data
          ? (axiosError.response.data as { message: string }).message
          : intl.formatMessage(messages.toastPlexTestFailure);

      addToast(errorMessage, {
        appearance: 'error',
        autoDismiss: true,
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Formik
      initialValues={{
        name: plex?.name ?? '',
        hostname: plex?.ip ?? '',
        port: plex?.port ?? 32400,
        useSsl: plex?.useSsl ?? false,
        webAppUrl: plex?.webAppUrl ?? '',
        authToken: plex?.authToken ?? '',
      }}
      validationSchema={PlexSettingsSchema}
      onSubmit={async (values) => {
        try {
          const submission: Partial<PlexSettings> = {
            ip: values.hostname,
            port: Number(values.port),
            useSsl: values.useSsl,
            name: values.name,
            webAppUrl: values.webAppUrl || undefined,
            authToken: values.authToken || undefined,
            libraries: plex?.libraries ?? [],
          };

          if (!plex) {
            await axios.post('/api/v1/settings/plex', submission);
          } else {
            await axios.put(`/api/v1/settings/plex/${plex.id}`, submission);
          }

          addToast(
            plex
              ? 'Plex server updated successfully!'
              : 'Plex server added successfully!',
            {
              appearance: 'success',
              autoDismiss: true,
            }
          );
          onSave();
        } catch (e) {
          addToast('Failed to save Plex server.', {
            appearance: 'error',
            autoDismiss: true,
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
          <Modal
            onCancel={onClose}
            okButtonType="primary"
            okText={
              isSubmitting
                ? intl.formatMessage(globalMessages.saving)
                : plex
                ? intl.formatMessage(globalMessages.save)
                : intl.formatMessage(messages.add)
            }
            secondaryButtonType="warning"
            secondaryText={
              isTesting
                ? intl.formatMessage(messages.testing)
                : intl.formatMessage(messages.testConnection)
            }
            onSecondary={() =>
              testConnection({
                hostname: values.hostname,
                port: values.port,
                useSsl: values.useSsl,
                authToken: values.authToken,
              })
            }
            secondaryDisabled={isTesting || !isValid}
            okDisabled={isSubmitting || !isValid}
            onOk={() => handleSubmit()}
            title={
              !plex
                ? intl.formatMessage(messages.createplex)
                : intl.formatMessage(messages.editplex)
            }
          >
            <div className="mb-6">
              {/* Server preset dropdown - only shown for first server */}
              {isFirstServer && (
                <div className="form-row">
                  <label htmlFor="preset" className="text-label">
                    {intl.formatMessage(messages.serverpreset)}
                  </label>
                  <div className="form-input-area">
                    <div className="form-input-field">
                      <select
                        id="preset"
                        name="preset"
                        disabled={!availableServers || isRefreshingPresets}
                        className="rounded-l-only"
                        onChange={async (e) => {
                          const targPreset =
                            availablePresets[Number(e.target.value)];

                          if (targPreset) {
                            setFieldValue('hostname', targPreset.address);
                            setFieldValue('port', targPreset.port);
                            setFieldValue('useSsl', targPreset.ssl);
                            setFieldValue('name', targPreset.name);
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
                        type="button"
                      >
                        <ArrowPathIcon
                          className={isRefreshingPresets ? 'animate-spin' : ''}
                          style={{ animationDirection: 'reverse' }}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div className="form-row">
                <label htmlFor="name" className="text-label">
                  {intl.formatMessage(messages.servername)}
                </label>
                <div className="form-input-area">
                  <div className="form-input-field">
                    <Field type="text" id="name" name="name" />
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
                  {errors.hostname &&
                    touched.hostname &&
                    typeof errors.hostname === 'string' && (
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
                  {errors.port &&
                    touched.port &&
                    typeof errors.port === 'string' && (
                      <div className="error">{errors.port}</div>
                    )}
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="useSsl" className="checkbox-label">
                  {intl.formatMessage(messages.ssl)}
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
                  {intl.formatMessage(messages.serverWebAppUrl)}
                  <span className="label-tip">
                    {intl.formatMessage(messages.serverWebAppUrlTip)}
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
                  {errors.webAppUrl &&
                    touched.webAppUrl &&
                    typeof errors.webAppUrl === 'string' && (
                      <div className="error">{errors.webAppUrl}</div>
                    )}
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="authToken" className="text-label">
                  {intl.formatMessage(messages.authToken)}
                  {!isFirstServer && <span className="label-required">*</span>}
                  <span className="label-tip">
                    {intl.formatMessage(
                      isFirstServer
                        ? messages.authTokenTip
                        : messages.authTokenTipRequired
                    )}
                  </span>
                </label>
                <div className="form-input-area">
                  <div className="form-input-field">
                    <Field
                      type="password"
                      id="authToken"
                      name="authToken"
                      placeholder={intl.formatMessage(
                        isFirstServer
                          ? messages.authTokenPlaceholder
                          : messages.authTokenPlaceholderRequired
                      )}
                      autoComplete="off"
                    />
                  </div>
                  {errors.authToken &&
                    touched.authToken &&
                    typeof errors.authToken === 'string' && (
                      <div className="error">{errors.authToken}</div>
                    )}
                </div>
              </div>
            </div>
          </Modal>
        );
      }}
    </Formik>
  );
};

export default PlexServerModal;
