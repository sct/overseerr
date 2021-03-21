import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';
import type { MainSettings } from '../../../../server/lib/settings';
import globalMessages from '../../../i18n/globalMessages';
import Button from '../../Common/Button';
import LoadingSpinner from '../../Common/LoadingSpinner';
import PageTitle from '../../Common/PageTitle';
import PermissionEdit from '../../PermissionEdit';

const messages = defineMessages({
  users: 'Users',
  userSettings: 'User Settings',
  userSettingsDescription: 'Configure global and default user settings.',
  save: 'Save Changes',
  saving: 'Saving…',
  toastSettingsSuccess: 'User settings saved successfully!',
  toastSettingsFailure: 'Something went wrong while saving settings.',
  localLogin: 'Enable Local Sign-In',
  movieRequestLimitLabel: 'Default Movie Request Limit',
  movieRequestLimit: '{quotaLimit} movies per {quotaDays} days',
  tvRequestLimitLabel: 'Default Series Request Limit',
  tvRequestLimit: '{quotaLimit} seasons per {quotaDays} days',
  defaultPermissions: 'Default Permissions',
  unlimited: 'Unlimited',
  validationQuotaLimit: 'You must enter a valid request limit',
  validationQuotaDays: 'You must enter a valid number of days',
});

const SettingsUsers: React.FC = () => {
  const { addToast } = useToasts();
  const intl = useIntl();
  const { data, error, revalidate } = useSWR<MainSettings>(
    '/api/v1/settings/main'
  );

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
            movieQuotaLimit: data?.defaultQuotas.movie.quotaLimit ?? 0,
            movieQuotaDays: data?.defaultQuotas.movie.quotaDays ?? 7,
            tvQuotaLimit: data?.defaultQuotas.tv.quotaLimit ?? 0,
            tvQuotaDays: data?.defaultQuotas.tv.quotaDays ?? 7,
            defaultPermissions: data?.defaultPermissions ?? 0,
          }}
          enableReinitialize
          onSubmit={async (values) => {
            try {
              await axios.post('/api/v1/settings/main', {
                localLogin: values.localLogin,
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
          {({ isSubmitting, values, setFieldValue }) => {
            return (
              <Form className="section">
                <div className="form-row">
                  <label htmlFor="localLogin" className="checkbox-label">
                    <span>{intl.formatMessage(messages.localLogin)}</span>
                  </label>
                  <div className="form-input">
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
                  <label htmlFor="applicationTitle" className="text-label">
                    {intl.formatMessage(messages.movieRequestLimitLabel)}
                  </label>
                  <div className="form-input">
                    {intl.formatMessage(messages.movieRequestLimit, {
                      quotaLimit: (
                        <Field
                          as="select"
                          id="movieQuotaLimit"
                          name="movieQuotaLimit"
                          className="inline short"
                        >
                          <option value="0">
                            {intl.formatMessage(messages.unlimited)}
                          </option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="5">5</option>
                          <option value="10">10</option>
                          <option value="25">25</option>
                          <option value="50">50</option>
                          <option value="100">100</option>
                        </Field>
                      ),
                      quotaDays: (
                        <Field
                          as="select"
                          id="movieQuotaDays"
                          name="movieQuotaDays"
                          className="inline short"
                        >
                          <option value="1">1</option>
                          <option value="7">7</option>
                          <option value="14">14</option>
                          <option value="30">30</option>
                          <option value="60">60</option>
                          <option value="90">90</option>
                        </Field>
                      ),
                    })}
                  </div>
                </div>
                <div className="form-row">
                  <label htmlFor="applicationTitle" className="text-label">
                    {intl.formatMessage(messages.tvRequestLimitLabel)}
                  </label>
                  <div className="form-input">
                    {intl.formatMessage(messages.tvRequestLimit, {
                      quotaLimit: (
                        <Field
                          as="select"
                          id="tvQuotaLimit"
                          name="tvQuotaLimit"
                          className="inline short"
                        >
                          <option value="0">
                            {intl.formatMessage(messages.unlimited)}
                          </option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="5">5</option>
                          <option value="10">10</option>
                          <option value="25">25</option>
                          <option value="50">50</option>
                          <option value="100">100</option>
                        </Field>
                      ),
                      quotaDays: (
                        <Field
                          as="select"
                          id="tvQuotaDays"
                          name="tvQuotaDays"
                          className="inline short"
                        >
                          <option value="1">1</option>
                          <option value="7">7</option>
                          <option value="14">14</option>
                          <option value="30">30</option>
                          <option value="60">60</option>
                          <option value="90">90</option>
                        </Field>
                      ),
                    })}
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
                    </span>
                    <div className="form-input">
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
              </Form>
            );
          }}
        </Formik>
      </div>
    </>
  );
};

export default SettingsUsers;
