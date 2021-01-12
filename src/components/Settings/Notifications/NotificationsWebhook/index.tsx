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

const messages = defineMessages({
  save: 'Save Changes',
  saving: 'Saving...',
  agentenabled: 'Agent Enabled',
  webhookUrl: 'Webhook URL',
  validationWebhookUrlRequired: 'You must provide a webhook URL',
  validationJsonPayloadRequired: 'You must provide a JSON Payload',
  webhookUrlPlaceholder: 'Remote webhook URL',
  webhooksettingssaved: 'Webhook notification settings saved!',
  webhooksettingsfailed: 'Webhook notification settings failed to save.',
  testsent: 'Test notification sent!',
  test: 'Test',
  notificationtypes: 'Notification Types',
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
        const testSettings = async () => {
          await axios.post('/api/v1/settings/notifications/webhook/test', {
            enabled: true,
            types: values.types,
            options: {
              webhookUrl: values.webhookUrl,
              jsonPayload: JSON.stringify(values.jsonPayload),
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
                Custom JSON
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
