import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import SettingsPlexServers from '@app/components/Settings/SettingsPlexServers';
import globalMessages from '@app/i18n/globalMessages';
import { ArrowDownOnSquareIcon } from '@heroicons/react/24/outline';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/solid';
import type { PlexSettings, TautulliSettings } from '@server/lib/settings';
import axios from 'axios';
import { Field, Formik } from 'formik';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';
import * as Yup from 'yup';

const messages = defineMessages({
  plex: 'Plex',
  plexsettings: 'Plex Settings',
  manualscan: 'Manual Library Scan',
  manualscanDescription:
    "Normally, this will only be run once every 24 hours. Overseerr will check your Plex server's recently added more aggressively. If this is your first time configuring Plex, a one-time full manual library scan is recommended!",
  currentlibrary: 'Current Library: {name}',
  currentserver: 'Current Server: {name}',
  librariesRemaining: 'Libraries Remaining: {count}',
  startscan: 'Start Scan',
  cancelscan: 'Cancel Scan',
  hostname: 'Hostname or IP Address',
  port: 'Port',
  enablessl: 'Use SSL',
  tautulliSettings: 'Tautulli Settings',
  tautulliSettingsDescription:
    'Optionally configure the settings for your Tautulli server. Overseerr fetches watch history data for your Plex media from Tautulli.',
  urlBase: 'URL Base',
  tautulliApiKey: 'API Key',
  externalUrl: 'External URL',
  validationHostnameRequired: 'You must provide a valid hostname or IP address',
  validationPortRequired: 'You must provide a valid port number',
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
  currentServer?: PlexSettings;
}

interface SettingsPlexProps {
  onComplete?: () => void;
}

const SettingsPlex = ({ onComplete }: SettingsPlexProps) => {
  const {
    data: plexServers,
    error,
    mutate: revalidatePlex,
  } = useSWR<PlexSettings[]>('/api/v1/settings/plex');
  const { data: dataTautulli, mutate: revalidateTautulli } =
    useSWR<TautulliSettings>('/api/v1/settings/tautulli');
  const { data: dataSync, mutate: revalidateSync } = useSWR<SyncStatus>(
    '/api/v1/settings/plex/sync',
    {
      refreshInterval: 1000,
    }
  );
  const intl = useIntl();
  const { addToast } = useToasts();

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

  // Check if any servers have enabled libraries
  const hasEnabledLibraries = plexServers?.some((server) =>
    server.libraries.some((lib) => lib.enabled)
  );

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

  if ((!plexServers || !dataTautulli) && !error) {
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
      <SettingsPlexServers
        onComplete={() => {
          revalidatePlex();
          if (onComplete) {
            onComplete();
          }
        }}
      />
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
                {dataSync.currentServer && (
                  <div className="mb-2 mr-0 flex items-center sm:mb-0 sm:mr-2">
                    <Badge badgeType="success">
                      {intl.formatMessage(messages.currentserver, {
                        name: dataSync.currentServer.name,
                      })}
                    </Badge>
                  </div>
                )}
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
                  disabled={!hasEnabledLibraries}
                >
                  <MagnifyingGlassIcon />
                  <span>{intl.formatMessage(messages.startscan)}</span>
                </Button>
              ) : (
                <Button buttonType="danger" onClick={() => cancelScan()}>
                  <XMarkIcon />
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
                      {errors.tautulliHostname &&
                        touched.tautulliHostname &&
                        typeof errors.tautulliHostname === 'string' && (
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
                        autoComplete="off"
                        data-1pignore="true"
                        data-lpignore="true"
                        data-bwignore="true"
                      />
                      {errors.tautulliPort &&
                        touched.tautulliPort &&
                        typeof errors.tautulliPort === 'string' && (
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
                          autoComplete="off"
                          data-1pignore="true"
                          data-lpignore="true"
                          data-bwignore="true"
                        />
                      </div>
                      {errors.tautulliUrlBase &&
                        touched.tautulliUrlBase &&
                        typeof errors.tautulliUrlBase === 'string' && (
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
                        />
                      </div>
                      {errors.tautulliApiKey &&
                        touched.tautulliApiKey &&
                        typeof errors.tautulliApiKey === 'string' && (
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
                          autoComplete="off"
                          data-1pignore="true"
                          data-lpignore="true"
                          data-bwignore="true"
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
                          <ArrowDownOnSquareIcon />
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
