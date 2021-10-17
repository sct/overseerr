import Button from '@app/components/Common/Button';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import PermissionEdit from '@app/components/PermissionEdit';
import QuotaSelector from '@app/components/QuotaSelector';
import useSettings from '@app/hooks/useSettings';
import globalMessages from '@app/i18n/globalMessages';
import { SaveIcon } from '@heroicons/react/outline';
import type { MainSettings } from '@server/lib/settings';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR, { mutate } from 'swr';
import * as Yup from 'yup';

const messages = defineMessages({
  users: 'Users',
  userSettings: 'User Settings',
  userSettingsDescription: 'Configure global and default user settings.',
  toastSettingsSuccess: 'User settings saved successfully!',
  toastSettingsFailure: 'Something went wrong while saving settings.',
  newPlexLogin: 'Enable New Plex Sign-Ins',
  newPlexLoginTip:
    'Allow Plex users with access to the media server to sign in without being imported',
  movieRequestLimitLabel: 'Global Movie Request Limit',
  tvRequestLimitLabel: 'Global Series Request Limit',
  defaultPermissions: 'Default Permissions',
  defaultPermissionsTip: 'Initial permissions assigned to new users',
  signinMethods: 'Sign-In Methods',
  passwordSignin: '{applicationTitle} Password',
  validationSigninMethods: 'At least one sign-in method must be selected',
});

const SettingsUsers = () => {
  const { addToast } = useToasts();
  const intl = useIntl();
  const settings = useSettings();
  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR<MainSettings>('/api/v1/settings/main');
  const { data: ownerData } = useSWR<{ hasPassword: boolean }>(
    '/api/v1/user/1/settings/password'
  );

  const SettingsUsersSchema = Yup.object().shape(
    {
      plexLogin: Yup.boolean().when('localLogin', {
        is: false,
        then: Yup.boolean().oneOf(
          [true],
          intl.formatMessage(messages.validationSigninMethods)
        ),
        otherwise: Yup.boolean(),
      }),
      localLogin: Yup.boolean().when('plexLogin', {
        is: false,
        then: Yup.boolean().oneOf(
          [true],
          intl.formatMessage(messages.validationSigninMethods)
        ),
        otherwise: Yup.boolean(),
      }),
    },
    [['plexLogin', 'localLogin']]
  );

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  const allowPlexSigninDisable =
    ownerData?.hasPassword &&
    !!settings.currentSettings.applicationUrl &&
    settings.currentSettings.emailEnabled;

  return (
    <>
      <PageTitle
        title={[
          intl.formatMessage(messages.users),
          intl.formatMessage(globalMessages.settings),
        ]}
      />
      <div className="mb-6">
        <h3 className="heading">{intl.formatMessage(messages.userSettings)}</h3>
        <p className="description">
          {intl.formatMessage(messages.userSettingsDescription)}
        </p>
      </div>
      <div className="section">
        <Formik
          initialValues={{
            localLogin: data?.localLogin,
            plexLogin: data?.plexLogin,
            newPlexLogin: data?.newPlexLogin,
            movieQuotaLimit: data?.defaultQuotas.movie.quotaLimit ?? 0,
            movieQuotaDays: data?.defaultQuotas.movie.quotaDays ?? 7,
            tvQuotaLimit: data?.defaultQuotas.tv.quotaLimit ?? 0,
            tvQuotaDays: data?.defaultQuotas.tv.quotaDays ?? 7,
            defaultPermissions: data?.defaultPermissions ?? 0,
          }}
          enableReinitialize
          validationSchema={SettingsUsersSchema}
          onSubmit={async (values) => {
            try {
              await axios.post('/api/v1/settings/main', {
                localLogin: values.localLogin,
                plexLogin: values.plexLogin,
                newPlexLogin: values.newPlexLogin,
                defaultQuotas: {
                  movie: {
                    quotaLimit: values.movieQuotaLimit,
                    quotaDays: values.movieQuotaDays,
                  },
                  tv: {
                    quotaLimit: values.tvQuotaLimit,
                    quotaDays: values.tvQuotaDays,
                  },
                },
                defaultPermissions: values.defaultPermissions,
              });
              mutate('/api/v1/settings/public');

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
          {({
            isSubmitting,
            values,
            setFieldValue,
            errors,
            touched,
            isValid,
          }) => {
            return (
              <Form className="section">
                <div
                  role="group"
                  aria-labelledby="group-label"
                  className="form-group"
                >
                  <div className="form-row">
                    <span id="group-label" className="group-label">
                      {intl.formatMessage(messages.signinMethods)}
                    </span>
                    <div className="form-input-area max-w-xl space-y-1.5">
                      <div
                        className={`relative flex items-start ${
                          allowPlexSigninDisable ? '' : 'opacity-50'
                        }`}
                      >
                        <div className="flex h-6 items-center">
                          <Field
                            type="checkbox"
                            id="plexLogin"
                            name="plexLogin"
                            onChange={() => {
                              setFieldValue('plexLogin', !values.plexLogin);
                            }}
                            disabled={!allowPlexSigninDisable}
                          />
                        </div>
                        <label
                          htmlFor="plexLogin"
                          className="ml-3 block text-sm font-semibold leading-6 text-white"
                        >
                          Plex OAuth
                        </label>
                      </div>
                      <div className="relative flex items-start">
                        <div className="flex h-6 items-center">
                          <Field
                            type="checkbox"
                            id="localLogin"
                            name="localLogin"
                            onChange={() => {
                              setFieldValue('localLogin', !values.localLogin);
                            }}
                          />
                        </div>
                        <label
                          htmlFor="localLogin"
                          className="ml-3 block text-sm font-semibold leading-6 text-white"
                        >
                          {intl.formatMessage(messages.passwordSignin, {
                            applicationTitle:
                              settings.currentSettings.applicationTitle,
                          })}
                        </label>
                      </div>
                      {(touched.plexLogin || touched.localLogin) &&
                        (errors.plexLogin || errors.localLogin) && (
                          <div className="error">
                            {errors.plexLogin ?? errors.localLogin}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
                <div
                  className={`form-row ${values.plexLogin ? '' : 'opacity-50'}`}
                >
                  <label htmlFor="newPlexLogin" className="checkbox-label">
                    {intl.formatMessage(messages.newPlexLogin)}
                    <span className="label-tip">
                      {intl.formatMessage(messages.newPlexLoginTip)}
                    </span>
                  </label>
                  <div className="form-input-area">
                    <Field
                      type="checkbox"
                      id="newPlexLogin"
                      name="newPlexLogin"
                      onChange={() => {
                        setFieldValue('newPlexLogin', !values.newPlexLogin);
                      }}
                      checked={values.newPlexLogin && values.plexLogin}
                      disabled={!values.plexLogin}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <label htmlFor="applicationTitle" className="text-label">
                    {intl.formatMessage(messages.movieRequestLimitLabel)}
                  </label>
                  <div className="form-input-area">
                    <QuotaSelector
                      onChange={setFieldValue}
                      dayFieldName="movieQuotaDays"
                      limitFieldName="movieQuotaLimit"
                      mediaType="movie"
                      defaultDays={values.movieQuotaDays}
                      defaultLimit={values.movieQuotaLimit}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <label htmlFor="applicationTitle" className="text-label">
                    {intl.formatMessage(messages.tvRequestLimitLabel)}
                  </label>
                  <div className="form-input-area">
                    <QuotaSelector
                      onChange={setFieldValue}
                      dayFieldName="tvQuotaDays"
                      limitFieldName="tvQuotaLimit"
                      mediaType="tv"
                      defaultDays={values.tvQuotaDays}
                      defaultLimit={values.tvQuotaLimit}
                    />
                  </div>
                </div>
                <div
                  role="group"
                  aria-labelledby="group-label"
                  className="form-group"
                >
                  <div className="form-row">
                    <span id="group-label" className="group-label">
                      {intl.formatMessage(messages.defaultPermissions)}
                      <span className="label-tip">
                        {intl.formatMessage(messages.defaultPermissionsTip)}
                      </span>
                    </span>
                    <div className="form-input-area max-w-xl">
                      <PermissionEdit
                        currentPermission={values.defaultPermissions}
                        onUpdate={(newPermissions) =>
                          setFieldValue('defaultPermissions', newPermissions)
                        }
                      />
                    </div>
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
              </Form>
            );
          }}
        </Formik>
      </div>
    </>
  );
};

export default SettingsUsers;
