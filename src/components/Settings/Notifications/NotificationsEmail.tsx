import React from 'react';
import { Field, Form, Formik } from 'formik';
import useSWR from 'swr';
import LoadingSpinner from '../../Common/LoadingSpinner';
import Button from '../../Common/Button';
import { defineMessages, useIntl } from 'react-intl';
import axios from 'axios';
import * as Yup from 'yup';
import { useToasts } from 'react-toast-notifications';

const messages = defineMessages({
  save: 'Save Changes',
  saving: 'Saving...',
  validationFromRequired: 'You must provide an email sender address',
  validationSmtpHostRequired: 'You must provide an SMTP host',
  validationSmtpPortRequired: 'You must provide an SMTP port',
  agentenabled: 'Agent Enabled',
  emailsender: 'Email Sender Address',
  smtpHost: 'SMTP Host',
  smtpPort: 'SMTP Port',
  enableSsl: 'Enable SSL',
  authUser: 'Auth User',
  authPass: 'Auth Pass',
  emailsettingssaved: 'Email notification settings saved!',
  emailsettingsfailed: 'Email notification settings failed to save.',
  test: 'Test',
  testsent: 'Test notification sent!',
  allowselfsigned: 'Allow Self-Signed Certificates',
  ssldisabletip:
    'SSL should be disabled on standard TLS connections (Port 587)',
});

const NotificationsEmail: React.FC = () => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const { data, error, revalidate } = useSWR(
    '/api/v1/settings/notifications/email'
  );

  const NotificationsEmailSchema = Yup.object().shape({
    emailFrom: Yup.string().required(
      intl.formatMessage(messages.validationFromRequired)
    ),
    smtpHost: Yup.string().required(
      intl.formatMessage(messages.validationSmtpHostRequired)
    ),
    smtpPort: Yup.number().required(
      intl.formatMessage(messages.validationSmtpPortRequired)
    ),
  });

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  return (
    <Formik
      initialValues={{
        enabled: data.enabled,
        types: data.types,
        emailFrom: data.options.emailFrom,
        smtpHost: data.options.smtpHost,
        smtpPort: data.options.smtpPort,
        secure: data.options.secure,
        authUser: data.options.authUser,
        authPass: data.options.authPass,
        allowSelfSigned: data.options.allowSelfSigned,
      }}
      validationSchema={NotificationsEmailSchema}
      onSubmit={async (values) => {
        try {
          await axios.post('/api/v1/settings/notifications/email', {
            enabled: values.enabled,
            types: values.types,
            options: {
              emailFrom: values.emailFrom,
              smtpHost: values.smtpHost,
              smtpPort: Number(values.smtpPort),
              secure: values.secure,
              authUser: values.authUser,
              authPass: values.authPass,
              allowSelfSigned: values.allowSelfSigned,
            },
          });
          addToast(intl.formatMessage(messages.emailsettingssaved), {
            appearance: 'success',
            autoDismiss: true,
          });
        } catch (e) {
          addToast(intl.formatMessage(messages.emailsettingsfailed), {
            appearance: 'error',
            autoDismiss: true,
          });
        } finally {
          revalidate();
        }
      }}
    >
      {({ errors, touched, isSubmitting, values, isValid }) => {
        const testSettings = async () => {
          await axios.post('/api/v1/settings/notifications/email/test', {
            enabled: true,
            types: values.types,
            options: {
              emailFrom: values.emailFrom,
              smtpHost: values.smtpHost,
              smtpPort: Number(values.smtpPort),
              secure: values.secure,
              authUser: values.authUser,
              authPass: values.authPass,
            },
          });

          addToast(intl.formatMessage(messages.testsent), {
            appearance: 'info',
            autoDismiss: true,
          });
        };

        return (
          <Form>
            <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
              <label
                htmlFor="enabled"
                className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px sm:pt-2"
              >
                {intl.formatMessage(messages.agentenabled)}
              </label>
              <div className="mt-1 sm:mt-0 sm:col-span-2">
                <Field
                  type="checkbox"
                  id="enabled"
                  name="enabled"
                  className="w-6 h-6 text-indigo-600 transition duration-150 ease-in-out rounded-md form-checkbox"
                />
              </div>
            </div>
            <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800 sm:pt-5">
              <label
                htmlFor="emailFrom"
                className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px sm:pt-2"
              >
                {intl.formatMessage(messages.emailsender)}
              </label>
              <div className="mt-1 sm:mt-0 sm:col-span-2">
                <div className="flex max-w-lg rounded-md shadow-sm">
                  <Field
                    id="emailFrom"
                    name="emailFrom"
                    type="text"
                    placeholder="no-reply@example.com"
                    className="flex-1 block w-full min-w-0 transition duration-150 ease-in-out bg-gray-700 border border-gray-500 rounded-md form-input sm:text-sm sm:leading-5"
                  />
                </div>
                {errors.emailFrom && touched.emailFrom && (
                  <div className="mt-2 text-red-500">{errors.emailFrom}</div>
                )}
              </div>
            </div>
            <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800 sm:pt-5">
              <label
                htmlFor="smtpHost"
                className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px sm:pt-2"
              >
                {intl.formatMessage(messages.smtpHost)}
              </label>
              <div className="mt-1 sm:mt-0 sm:col-span-2">
                <div className="flex max-w-lg rounded-md shadow-sm">
                  <Field
                    id="smtpHost"
                    name="smtpHost"
                    type="text"
                    placeholder="localhost"
                    className="flex-1 block w-full min-w-0 transition duration-150 ease-in-out bg-gray-700 border border-gray-500 rounded-md form-input sm:text-sm sm:leading-5"
                  />
                </div>
                {errors.smtpHost && touched.smtpHost && (
                  <div className="mt-2 text-red-500">{errors.smtpHost}</div>
                )}
              </div>
            </div>
            <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800 sm:pt-5">
              <label
                htmlFor="smtpPort"
                className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px sm:pt-2"
              >
                {intl.formatMessage(messages.smtpPort)}
              </label>
              <div className="mt-1 sm:mt-0 sm:col-span-2">
                <div className="flex max-w-lg rounded-md shadow-sm">
                  <Field
                    id="smtpPort"
                    name="smtpPort"
                    type="text"
                    placeholder="465"
                    className="block w-24 transition duration-150 ease-in-out bg-gray-700 border border-gray-500 rounded-md form-input sm:text-sm sm:leading-5"
                  />
                </div>
                {errors.smtpPort && touched.smtpPort && (
                  <div className="mt-2 text-red-500">{errors.smtpPort}</div>
                )}
              </div>
            </div>
            <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
              <label
                htmlFor="secure"
                className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px sm:pt-2"
              >
                <div className="flex flex-col">
                  <span>{intl.formatMessage(messages.enableSsl)}</span>
                  <span className="text-gray-500">
                    {intl.formatMessage(messages.ssldisabletip)}
                  </span>
                </div>
              </label>
              <div className="mt-1 sm:mt-0 sm:col-span-2">
                <Field
                  type="checkbox"
                  id="secure"
                  name="secure"
                  className="w-6 h-6 text-indigo-600 transition duration-150 ease-in-out rounded-md form-checkbox"
                />
              </div>
            </div>
            <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
              <label
                htmlFor="allowSelfSigned"
                className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px sm:pt-2"
              >
                {intl.formatMessage(messages.allowselfsigned)}
              </label>
              <div className="mt-1 sm:mt-0 sm:col-span-2">
                <Field
                  type="checkbox"
                  id="allowSelfSigned"
                  name="allowSelfSigned"
                  className="w-6 h-6 text-indigo-600 transition duration-150 ease-in-out rounded-md form-checkbox"
                />
              </div>
            </div>
            <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800 sm:pt-5">
              <label
                htmlFor="authUser"
                className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px sm:pt-2"
              >
                {intl.formatMessage(messages.authUser)}
              </label>
              <div className="mt-1 sm:mt-0 sm:col-span-2">
                <div className="flex max-w-lg rounded-md shadow-sm">
                  <Field
                    id="authUser"
                    name="authUser"
                    type="text"
                    className="flex-1 block w-full min-w-0 transition duration-150 ease-in-out bg-gray-700 border border-gray-500 rounded-md form-input sm:text-sm sm:leading-5"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800 sm:pt-5">
              <label
                htmlFor="authPass"
                className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px sm:pt-2"
              >
                {intl.formatMessage(messages.authPass)}
              </label>
              <div className="mt-1 sm:mt-0 sm:col-span-2">
                <div className="flex max-w-lg rounded-md shadow-sm">
                  <Field
                    id="authPass"
                    name="authPass"
                    type="password"
                    className="flex-1 block w-full min-w-0 transition duration-150 ease-in-out bg-gray-700 border border-gray-500 rounded-md form-input sm:text-sm sm:leading-5"
                  />
                </div>
              </div>
            </div>
            <div className="pt-5 mt-8 border-t border-gray-700">
              <div className="flex justify-end">
                <span className="inline-flex ml-3 rounded-md shadow-sm">
                  <Button
                    buttonType="warning"
                    disabled={isSubmitting || !isValid}
                    onClick={(e) => {
                      e.preventDefault();

                      testSettings();
                    }}
                  >
                    {intl.formatMessage(messages.test)}
                  </Button>
                </span>
                <span className="inline-flex ml-3 rounded-md shadow-sm">
                  <Button
                    buttonType="primary"
                    type="submit"
                    disabled={isSubmitting || !isValid}
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
  );
};

export default NotificationsEmail;
