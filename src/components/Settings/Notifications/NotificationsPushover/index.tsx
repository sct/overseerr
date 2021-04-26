import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import React, { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';
import * as Yup from 'yup';
import globalMessages from '../../../../i18n/globalMessages';
import Alert from '../../../Common/Alert';
import Button from '../../../Common/Button';
import LoadingSpinner from '../../../Common/LoadingSpinner';
import NotificationTypeSelector from '../../../NotificationTypeSelector';

const messages = defineMessages({
  agentenabled: 'Enable Agent',
  accessToken: 'Application/API Token',
  userToken: 'User or Group Key',
  validationAccessTokenRequired: 'You must provide a valid application token',
  validationUserTokenRequired: 'You must provide a valid user key',
  pushoversettingssaved: 'Pushover notification settings saved successfully!',
  pushoversettingsfailed: 'Pushover notification settings failed to save.',
  toastPushoverTestSending: 'Sending Pushover test notification…',
  toastPushoverTestSuccess: 'Pushover test notification sent!',
  toastPushoverTestFailed: 'Pushover test notification failed to send.',
  settinguppushoverDescription:
    'To configure Pushover notifications, you will need to <RegisterApplicationLink>register an application</RegisterApplicationLink>. (You can use one of the <IconLink>official Overseerr icons on GitHub</IconLink>.)',
});

const NotificationsPushover: React.FC = () => {
  const intl = useIntl();
  const { addToast, removeToast } = useToasts();
  const [isTesting, setIsTesting] = useState(false);
  const { data, error, revalidate } = useSWR(
    '/api/v1/settings/notifications/pushover'
  );

  const NotificationsPushoverSchema = Yup.object().shape({
    accessToken: Yup.string()
      .when('enabled', {
        is: true,
        then: Yup.string()
          .nullable()
          .required(intl.formatMessage(messages.validationAccessTokenRequired)),
        otherwise: Yup.string().nullable(),
      })
      .matches(
        /^[a-z\d]{30}$/i,
        intl.formatMessage(messages.validationAccessTokenRequired)
      ),
    userToken: Yup.string()
      .when('enabled', {
        is: true,
        then: Yup.string()
          .nullable()
          .required(intl.formatMessage(messages.validationUserTokenRequired)),
        otherwise: Yup.string().nullable(),
      })
      .matches(
        /^[a-z\d]{30}$/i,
        intl.formatMessage(messages.validationUserTokenRequired)
      ),
  });

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  return (
    <Formik
      initialValues={{
        enabled: data?.enabled,
        types: data?.types,
        accessToken: data?.options.accessToken,
        userToken: data?.options.userToken,
      }}
      validationSchema={NotificationsPushoverSchema}
      onSubmit={async (values) => {
        try {
          await axios.post('/api/v1/settings/notifications/pushover', {
            enabled: values.enabled,
            types: values.types,
            options: {
              accessToken: values.accessToken,
              userToken: values.userToken,
            },
          });
          addToast(intl.formatMessage(messages.pushoversettingssaved), {
            appearance: 'success',
            autoDismiss: true,
          });
        } catch (e) {
          addToast(intl.formatMessage(messages.pushoversettingsfailed), {
            appearance: 'error',
            autoDismiss: true,
          });
        } finally {
          revalidate();
        }
      }}
    >
      {({ errors, touched, isSubmitting, values, isValid, setFieldValue }) => {
        const testSettings = async () => {
          setIsTesting(true);
          let toastId: string | undefined;
          try {
            addToast(
              intl.formatMessage(messages.toastPushoverTestSending),
              {
                autoDismiss: false,
                appearance: 'info',
              },
              (id) => {
                toastId = id;
              }
            );
            await axios.post('/api/v1/settings/notifications/pushover/test', {
              enabled: true,
              types: values.types,
              options: {
                accessToken: values.accessToken,
                userToken: values.userToken,
              },
            });

            if (toastId) {
              removeToast(toastId);
            }
            addToast(intl.formatMessage(messages.toastPushoverTestSuccess), {
              autoDismiss: true,
              appearance: 'success',
            });
          } catch (e) {
            if (toastId) {
              removeToast(toastId);
            }
            addToast(intl.formatMessage(messages.toastPushoverTestFailed), {
              autoDismiss: true,
              appearance: 'error',
            });
          } finally {
            setIsTesting(false);
          }
        };

        return (
          <>
            <Alert
              title={intl.formatMessage(messages.settinguppushoverDescription, {
                RegisterApplicationLink: function RegisterApplicationLink(msg) {
                  return (
                    <a
                      href="https://pushover.net/apps/build"
                      className="text-white transition duration-300 hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {msg}
                    </a>
                  );
                },
                IconLink: function IconLink(msg) {
                  return (
                    <a
                      href="https://github.com/sct/overseerr/tree/develop/public"
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
            <Form className="section">
              <div className="form-row">
                <label htmlFor="enabled" className="checkbox-label">
                  {intl.formatMessage(messages.agentenabled)}
                </label>
                <div className="form-input">
                  <Field type="checkbox" id="enabled" name="enabled" />
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="accessToken" className="text-label">
                  {intl.formatMessage(messages.accessToken)}
                  <span className="label-required">*</span>
                </label>
                <div className="form-input">
                  <div className="form-input-field">
                    <Field
                      id="accessToken"
                      name="accessToken"
                      type="text"
                      placeholder={intl.formatMessage(messages.accessToken)}
                    />
                  </div>
                  {errors.accessToken && touched.accessToken && (
                    <div className="error">{errors.accessToken}</div>
                  )}
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="userToken" className="text-label">
                  {intl.formatMessage(messages.userToken)}
                  <span className="label-required">*</span>
                </label>
                <div className="form-input">
                  <div className="form-input-field">
                    <Field
                      id="userToken"
                      name="userToken"
                      type="text"
                      placeholder={intl.formatMessage(messages.userToken)}
                    />
                  </div>
                  {errors.userToken && touched.userToken && (
                    <div className="error">{errors.userToken}</div>
                  )}
                </div>
              </div>
              <NotificationTypeSelector
                currentTypes={values.types}
                onUpdate={(newTypes) => setFieldValue('types', newTypes)}
              />
              <div className="actions">
                <div className="flex justify-end">
                  <span className="inline-flex ml-3 rounded-md shadow-sm">
                    <Button
                      buttonType="warning"
                      disabled={isSubmitting || !isValid || isTesting}
                      onClick={(e) => {
                        e.preventDefault();
                        testSettings();
                      }}
                    >
                      {isTesting
                        ? intl.formatMessage(globalMessages.testing)
                        : intl.formatMessage(globalMessages.test)}
                    </Button>
                  </span>
                  <span className="inline-flex ml-3 rounded-md shadow-sm">
                    <Button
                      buttonType="primary"
                      type="submit"
                      disabled={isSubmitting || !isValid || isTesting}
                    >
                      {isSubmitting
                        ? intl.formatMessage(globalMessages.saving)
                        : intl.formatMessage(globalMessages.save)}
                    </Button>
                  </span>
                </div>
              </div>
            </Form>
          </>
        );
      }}
    </Formik>
  );
};

export default NotificationsPushover;
