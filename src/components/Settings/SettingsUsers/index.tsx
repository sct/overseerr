import Button from '@app/components/Common/Button';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import PermissionEdit from '@app/components/PermissionEdit';
import QuotaSelector from '@app/components/QuotaSelector';
import globalMessages from '@app/i18n/globalMessages';
import { ArrowDownOnSquareIcon } from '@heroicons/react/24/outline';
import type { MainSettings } from '@server/lib/settings';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR, { mutate } from 'swr';
import * as yup from 'yup';

const messages = defineMessages({
  users: 'Users',
  userSettings: 'User Settings',
  userSettingsDescription: 'Configure global and default user settings.',
  toastSettingsSuccess: 'User settings saved successfully!',
  toastSettingsFailure: 'Something went wrong while saving settings.',
  localLogin: 'Enable Local Sign-In',
  localLoginTip:
    'Allow users to sign in using their email address and password, instead of Plex OAuth',
  newPlexLogin: 'Enable New Plex Sign-In',
  newPlexLoginTip: 'Allow Plex users to sign in without first being imported',
  movieRequestLimitLabel: 'Global Movie Request Limit',
  tvRequestLimitLabel: 'Global Series Request Limit',
  defaultPermissions: 'Default Permissions',
  defaultPermissionsTip: 'Initial permissions assigned to new users',
  oidcLogin: 'Enable OIDC Sign-In',
  oidcLoginTip: 'Allow users to sign in using an OIDC provider',
  oidcName: 'OIDC Provider Name',
  oidcNameTip: 'The string used as name on the login page',
  oidcClientId: 'OIDC Client ID',
  oidcClientSecret: 'OIDC Client Secret',
  oidcDomain: 'OIDC Domain',
});

const validationSchema = yup.object().shape({
  oidcLogin: yup.boolean(),
  oidcClientId: yup.string().when('oidcLogin', {
    is: true,
    then: yup.string().required(),
  }),
  oidcClientSecret: yup.string().when('oidcLogin', {
    is: true,
    then: yup.string().required(),
  }),
  oidcDomain: yup.string().when('oidcLogin', {
    is: true,
    then: yup
      .string()
      .required()
      .test({
        message: 'Must be a valid domain',
        test: (val) => {
          return (
            !!val &&
            /^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/.test(
              val
            )
          );
        },
      }),
  }),
});

const SettingsUsers: React.FC = () => {
  const { addToast } = useToasts();
  const intl = useIntl();
  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR<MainSettings>('/api/v1/settings/main');

  if (!data && !error) {
    return <LoadingSpinner />;
  }

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
            newPlexLogin: data?.newPlexLogin,
            oidcName: data?.oidcName,
            oidcLogin: data?.oidcLogin,
            oidcClientId: data?.oidcClientId,
            oidcClientSecret: data?.oidcClientSecret,
            oidcDomain: data?.oidcDomain,
            movieQuotaLimit: data?.defaultQuotas.movie.quotaLimit ?? 0,
            movieQuotaDays: data?.defaultQuotas.movie.quotaDays ?? 7,
            tvQuotaLimit: data?.defaultQuotas.tv.quotaLimit ?? 0,
            tvQuotaDays: data?.defaultQuotas.tv.quotaDays ?? 7,
            defaultPermissions: data?.defaultPermissions ?? 0,
          }}
          validationSchema={validationSchema}
          enableReinitialize
          onSubmit={async (values) => {
            try {
              await axios.post('/api/v1/settings/main', {
                localLogin: values.localLogin,
                newPlexLogin: values.newPlexLogin,
                oidcLogin: values.oidcLogin,
                oidcClientId: values.oidcClientId,
                oidcClientSecret: values.oidcClientSecret,
                oidcDomain: values.oidcDomain,
                oidcName: values.oidcName,
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
          {({ isSubmitting, values, setFieldValue, errors, touched }) => {
            return (
              <Form className="section">
                <div className="form-row">
                  <label htmlFor="localLogin" className="checkbox-label">
                    {intl.formatMessage(messages.localLogin)}
                    <span className="label-tip">
                      {intl.formatMessage(messages.localLoginTip)}
                    </span>
                  </label>
                  <div className="form-input-area">
                    <Field
                      type="checkbox"
                      id="localLogin"
                      name="localLogin"
                      onChange={() => {
                        setFieldValue('localLogin', !values.localLogin);
                      }}
                    />
                  </div>
                </div>
                <div className="form-row">
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
                    />
                  </div>
                </div>
                <div className="form-row">
                  <label htmlFor="oidcLogin" className="checkbox-label">
                    {intl.formatMessage(messages.oidcLogin)}
                    <span className="label-tip">
                      {intl.formatMessage(messages.oidcLoginTip)}
                    </span>
                  </label>
                  <div className="form-input-area">
                    <Field
                      type="checkbox"
                      id="oidcLogin"
                      name="oidcLogin"
                      onChange={() => {
                        setFieldValue('oidcLogin', !values.oidcLogin);
                      }}
                    />
                  </div>
                </div>
                {values.oidcLogin ? (
                  <>
                    <div className="form-row">
                      <label htmlFor="oidcName" className="group-label">
                        {intl.formatMessage(messages.oidcName)}
                        <span className="label-tip">
                          {intl.formatMessage(messages.oidcNameTip)}
                        </span>
                      </label>
                      <div className="form-input-area">
                        <div className="form-input-field">
                          <Field id="oidcName" name="oidcName" type="text" />
                        </div>
                      </div>
                    </div>
                    <div className="form-row">
                      <label htmlFor="oidcDomain" className="text-label">
                        {intl.formatMessage(messages.oidcDomain)}
                      </label>
                      <div className="form-input-area">
                        <div className="form-input-field">
                          <Field
                            id="oidcDomain"
                            name="oidcDomain"
                            type="text"
                          />
                        </div>
                        {errors.oidcDomain && touched.oidcDomain && (
                          <div className="error">{errors.oidcDomain}</div>
                        )}
                      </div>
                    </div>
                    <div className="form-row">
                      <label htmlFor="oidcClientId" className="text-label">
                        {intl.formatMessage(messages.oidcClientId)}
                      </label>
                      <div className="form-input-area">
                        <div className="form-input-field">
                          <Field
                            id="oidcClientId"
                            name="oidcClientId"
                            type="text"
                          />
                        </div>
                        {errors.oidcClientId && touched.oidcDomain && (
                          <div className="error">{errors.oidcClientId}</div>
                        )}
                      </div>
                    </div>
                    <div className="form-row">
                      <label htmlFor="oidcClientSecret" className="text-label">
                        {intl.formatMessage(messages.oidcClientSecret)}
                      </label>
                      <div className="form-input-area">
                        <div className="form-input-field">
                          <SensitiveInput
                            type="password"
                            id="oidcClientSecret"
                            className="rounded-l-only"
                            defaultValue={data?.oidcClientSecret}
                            onChange={(e) => {
                              setFieldValue('oidcClientSecret', e.target.value);
                            }}
                            autoComplete="off"
                          />
                        </div>
                        {errors.oidcClientSecret &&
                          touched.oidcClientSecret && (
                            <div className="error">
                              {errors.oidcClientSecret}
                            </div>
                          )}
                      </div>
                    </div>
                  </>
                ) : null}
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
                    <div className="form-input-area">
                      <div className="max-w-lg">
                        <PermissionEdit
                          currentPermission={values.defaultPermissions}
                          onUpdate={(newPermissions) =>
                            setFieldValue('defaultPermissions', newPermissions)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="actions">
                  <div className="flex justify-end">
                    <span className="ml-3 inline-flex rounded-md shadow-sm">
                      <Button
                        buttonType="primary"
                        type="submit"
                        disabled={isSubmitting}
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
              </Form>
            );
          }}
        </Formik>
      </div>
    </>
  );
};

export default SettingsUsers;
