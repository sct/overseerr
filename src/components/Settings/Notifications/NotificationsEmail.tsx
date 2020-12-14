import React from 'react';
import { Field, Form, Formik } from 'formik';
import useSWR from 'swr';
import LoadingSpinner from '../../Common/LoadingSpinner';
import Button from '../../Common/Button';
import { defineMessages, useIntl } from 'react-intl';
import Axios from 'axios';
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
});

const NotificationsEmail: React.FC = () => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const { data, error, revalidate } = useSWR(
    '/api/v1/settings/notifications/email'
  );

  const NotificationsDiscordSchema = Yup.object().shape({
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
      }}
      validationSchema={NotificationsDiscordSchema}
      onSubmit={async (values) => {
        try {
          await Axios.post('/api/v1/settings/notifications/email', {
            enabled: values.enabled,
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
      {({ errors, touched, isSubmitting }) => {
        return (
          <Form>
            <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
              <label
                htmlFor="isDefault"
                className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px sm:pt-2"
              >
                {intl.formatMessage(messages.agentenabled)}
              </label>
              <div className="mt-1 sm:mt-0 sm:col-span-2">
                <Field
                  type="checkbox"
                  id="enabled"
                  name="enabled"
                  className="form-checkbox rounded-md h-6 w-6 text-indigo-600 transition duration-150 ease-in-out"
                />
              </div>
            </div>
            <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800 sm:pt-5">
              <label
                htmlFor="name"
                className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px sm:pt-2"
              >
                {intl.formatMessage(messages.emailsender)}
              </label>
              <div className="mt-1 sm:mt-0 sm:col-span-2">
                <div className="max-w-lg flex rounded-md shadow-sm">
                  <Field
                    id="emailFrom"
                    name="emailFrom"
                    type="text"
                    placeholder="no-reply@example.com"
                    className="flex-1 form-input block w-full min-w-0 rounded-md transition duration-150 ease-in-out sm:text-sm sm:leading-5 bg-gray-700 border border-gray-500"
                  />
                </div>
                {errors.emailFrom && touched.emailFrom && (
                  <div className="text-red-500 mt-2">{errors.emailFrom}</div>
                )}
              </div>
            </div>
            <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800 sm:pt-5">
              <label
                htmlFor="name"
                className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px sm:pt-2"
              >
                {intl.formatMessage(messages.smtpHost)}
              </label>
              <div className="mt-1 sm:mt-0 sm:col-span-2">
                <div className="max-w-lg flex rounded-md shadow-sm">
                  <Field
                    id="smtpHost"
                    name="smtpHost"
                    type="text"
                    placeholder="localhost"
                    className="flex-1 form-input block w-full min-w-0 rounded-md transition duration-150 ease-in-out sm:text-sm sm:leading-5 bg-gray-700 border border-gray-500"
                  />
                </div>
                {errors.smtpHost && touched.smtpHost && (
                  <div className="text-red-500 mt-2">{errors.smtpHost}</div>
                )}
              </div>
            </div>
            <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800 sm:pt-5">
              <label
                htmlFor="name"
                className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px sm:pt-2"
              >
                {intl.formatMessage(messages.smtpPort)}
              </label>
              <div className="mt-1 sm:mt-0 sm:col-span-2">
                <div className="max-w-lg flex rounded-md shadow-sm">
                  <Field
                    id="smtpPort"
                    name="smtpPort"
                    type="text"
                    placeholder="465"
                    className="form-input block w-24 rounded-md transition duration-150 ease-in-out sm:text-sm sm:leading-5 bg-gray-700 border border-gray-500"
                  />
                </div>
                {errors.smtpPort && touched.smtpPort && (
                  <div className="text-red-500 mt-2">{errors.smtpPort}</div>
                )}
              </div>
            </div>
            <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
              <label
                htmlFor="isDefault"
                className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px sm:pt-2"
              >
                {intl.formatMessage(messages.enableSsl)}
              </label>
              <div className="mt-1 sm:mt-0 sm:col-span-2">
                <Field
                  type="checkbox"
                  id="secure"
                  name="secure"
                  className="form-checkbox rounded-md h-6 w-6 text-indigo-600 transition duration-150 ease-in-out"
                />
              </div>
            </div>
            <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800 sm:pt-5">
              <label
                htmlFor="name"
                className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px sm:pt-2"
              >
                {intl.formatMessage(messages.authUser)}
              </label>
              <div className="mt-1 sm:mt-0 sm:col-span-2">
                <div className="max-w-lg flex rounded-md shadow-sm">
                  <Field
                    id="authUser"
                    name="authUser"
                    type="text"
                    className="flex-1 form-input block w-full min-w-0 rounded-md transition duration-150 ease-in-out sm:text-sm sm:leading-5 bg-gray-700 border border-gray-500"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800 sm:pt-5">
              <label
                htmlFor="name"
                className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px sm:pt-2"
              >
                {intl.formatMessage(messages.authPass)}
              </label>
              <div className="mt-1 sm:mt-0 sm:col-span-2">
                <div className="max-w-lg flex rounded-md shadow-sm">
                  <Field
                    id="authPass"
                    name="authPass"
                    type="password"
                    className="flex-1 form-input block w-full min-w-0 rounded-md transition duration-150 ease-in-out sm:text-sm sm:leading-5 bg-gray-700 border border-gray-500"
                  />
                </div>
              </div>
            </div>
            <div className="mt-8 border-t border-gray-700 pt-5">
              <div className="flex justify-end">
                <span className="ml-3 inline-flex rounded-md shadow-sm">
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
  );
};

export default NotificationsEmail;
