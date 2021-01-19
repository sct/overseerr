import React from 'react';
import { Field, Form, Formik } from 'formik';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import LoadingSpinner from '../../../Common/LoadingSpinner';
import Button from '../../../Common/Button';
import { defineMessages, useIntl } from 'react-intl';
import axios from 'axios';
import * as Yup from 'yup';
import { useToasts } from 'react-toast-notifications';
import NotificationTypeSelector from '../../../NotificationTypeSelector';

const JSONEditor = dynamic(() => import('../../../JSONEditor'), { ssr: false });

const defaultPayload = {
  notification_type: '{{notification_type}}',
  subject: '{{subject}}',
  message: '{{message}}',
  image: '{{image}}',
  email: '{{notifyuser_email}}',
  username: '{{notifyuser_username}}',
  avatar: '{{notifyuser_avatar}}',
  '{{media}}': {
    media_type: '{{media_type}}',
    tmdbId: '{{media_tmdbid}}',
    imdbId: '{{media_imdbid}}',
    tvdbId: '{{media_tvdbid}}',
    status: '{{media_status}}',
    status4k: '{{media_status4k}}',
  },
  '{{extra}}': [],
};

const messages = defineMessages({
  save: 'Save Changes',
  saving: 'Saving...',
  agentenabled: 'Agent Enabled',
  webhookUrl: 'Webhook URL',
  authheader: 'Authorization Header',
  validationWebhookUrlRequired: 'You must provide a webhook URL',
  validationJsonPayloadRequired: 'You must provide a JSON Payload',
  webhookUrlPlaceholder: 'Remote webhook URL',
  webhooksettingssaved: 'Webhook notification settings saved!',
  webhooksettingsfailed: 'Webhook notification settings failed to save.',
  testsent: 'Test notification sent!',
  test: 'Test',
  notificationtypes: 'Notification Types',
  resetPayload: 'Reset to Default JSON Payload',
  resetPayloadSuccess: 'JSON reset to default payload.',
  customJson: 'Custom JSON Payload',
  templatevariablehelp: 'Template Variable Help',
});

const NotificationsWebhook: React.FC = () => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const { data, error, revalidate } = useSWR(
    '/api/v1/settings/notifications/webhook'
  );

  const NotificationsWebhookSchema = Yup.object().shape({
    webhookUrl: Yup.string().required(
      intl.formatMessage(messages.validationWebhookUrlRequired)
    ),
    jsonPayload: Yup.string()
      .required(intl.formatMessage(messages.validationJsonPayloadRequired))
      .test('validate-json', 'Invalid JSON', (value) => {
        try {
          JSON.parse(value ?? '');
          return true;
        } catch (e) {
          return false;
        }
      }),
  });

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  return (
    <Formik
      initialValues={{
        enabled: data.enabled,
        types: data.types,
        webhookUrl: data.options.webhookUrl,
        jsonPayload: data.options.jsonPayload,
        authHeader: data.options.authHeader,
      }}
      validationSchema={NotificationsWebhookSchema}
      onSubmit={async (values) => {
        try {
          await axios.post('/api/v1/settings/notifications/webhook', {
            enabled: values.enabled,
            types: values.types,
            options: {
              webhookUrl: values.webhookUrl,
              jsonPayload: JSON.stringify(values.jsonPayload),
              authHeader: values.authHeader,
            },
          });
          addToast(intl.formatMessage(messages.webhooksettingssaved), {
            appearance: 'success',
            autoDismiss: true,
          });
        } catch (e) {
          addToast(intl.formatMessage(messages.webhooksettingsfailed), {
            appearance: 'error',
            autoDismiss: true,
          });
        } finally {
          revalidate();
        }
      }}
    >
      {({
        errors,
        touched,
        isSubmitting,
        values,
        isValid,
        setFieldValue,
        setFieldTouched,
      }) => {
        const resetPayload = () => {
          setFieldValue(
            'jsonPayload',
            JSON.stringify(defaultPayload, undefined, '    ')
          );
          addToast(intl.formatMessage(messages.resetPayloadSuccess), {
            appearance: 'info',
            autoDismiss: true,
          });
        };

        const testSettings = async () => {
          await axios.post('/api/v1/settings/notifications/webhook/test', {
            enabled: true,
            types: values.types,
            options: {
              webhookUrl: values.webhookUrl,
              jsonPayload: JSON.stringify(values.jsonPayload),
              authHeader: values.authHeader,
            },
          });

          addToast(intl.formatMessage(messages.testsent), {
            appearance: 'info',
            autoDismiss: true,
          });
        };

        return (
          <Form>
            <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200">
              <label
                htmlFor="enabled"
                className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px"
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
            <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800">
              <label
                htmlFor="name"
                className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px"
              >
                {intl.formatMessage(messages.webhookUrl)}
              </label>
              <div className="mt-1 sm:mt-0 sm:col-span-2">
                <div className="flex max-w-lg rounded-md shadow-sm">
                  <Field
                    id="webhookUrl"
                    name="webhookUrl"
                    type="text"
                    placeholder={intl.formatMessage(
                      messages.webhookUrlPlaceholder
                    )}
                    className="flex-1 block w-full min-w-0 transition duration-150 ease-in-out bg-gray-700 border border-gray-500 rounded-md form-input sm:text-sm sm:leading-5"
                  />
                </div>
                {errors.webhookUrl && touched.webhookUrl && (
                  <div className="mt-2 text-red-500">{errors.webhookUrl}</div>
                )}
              </div>
            </div>
            <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800">
              <label
                htmlFor="name"
                className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px"
              >
                {intl.formatMessage(messages.authheader)}
              </label>
              <div className="mt-1 sm:mt-0 sm:col-span-2">
                <div className="flex max-w-lg rounded-md shadow-sm">
                  <Field
                    id="authHeader"
                    name="authHeader"
                    type="text"
                    className="flex-1 block w-full min-w-0 transition duration-150 ease-in-out bg-gray-700 border border-gray-500 rounded-md form-input sm:text-sm sm:leading-5"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800">
              <label
                htmlFor="name"
                className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px"
              >
                {intl.formatMessage(messages.customJson)}
              </label>
              <div className="mt-1 sm:mt-0 sm:col-span-2">
                <div className="flex max-w-lg rounded-md shadow-sm">
                  <JSONEditor
                    name="webhook-json-payload"
                    onUpdate={(value) => setFieldValue('jsonPayload', value)}
                    value={values.jsonPayload}
                    onBlur={() => setFieldTouched('jsonPayload')}
                  />
                </div>
                {errors.jsonPayload && touched.jsonPayload && (
                  <div className="mt-2 text-red-500">{errors.jsonPayload}</div>
                )}
                <div className="mt-2">
                  <Button
                    buttonSize="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      resetPayload();
                    }}
                    className="mr-2"
                  >
                    <svg
                      className="w-5 h-5 mr-1"
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
                    {intl.formatMessage(messages.resetPayload)}
                  </Button>
                  <a
                    href="https://docs.overseerr.dev/using-overseerr/notifications/webhooks#template-variables"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center font-medium leading-5 text-white transition duration-150 ease-in-out bg-indigo-600 border border-transparent rounded-md focus:outline-none hover:bg-indigo-500 focus:border-indigo-700 focus:ring-indigo active:bg-indigo-700 disabled:opacity-50 px-2.5 py-1.5 text-xs"
                  >
                    <svg
                      className="w-5 h-5 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {intl.formatMessage(messages.templatevariablehelp)}
                  </a>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <div role="group" aria-labelledby="label-permissions">
                <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-baseline">
                  <div>
                    <div
                      className="text-base font-medium leading-6 text-gray-400 sm:text-sm sm:leading-5"
                      id="label-types"
                    >
                      {intl.formatMessage(messages.notificationtypes)}
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-0 sm:col-span-2">
                    <div className="max-w-lg">
                      <NotificationTypeSelector
                        currentTypes={values.types}
                        onUpdate={(newTypes) =>
                          setFieldValue('types', newTypes)
                        }
                      />
                    </div>
                  </div>
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

export default NotificationsWebhook;
