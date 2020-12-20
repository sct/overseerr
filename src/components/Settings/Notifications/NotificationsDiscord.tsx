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
  agentenabled: 'Agent Enabled',
  webhookUrl: 'Webhook URL',
  validationWebhookUrlRequired: 'You must provide a webhook URL',
  webhookUrlPlaceholder: 'Server Settings -> Integrations -> Webhooks',
  discordsettingssaved: 'Discord notification settings saved!',
  discordsettingsfailed: 'Discord notification settings failed to save.',
  testsent: 'Test notification sent!',
  test: 'Test',
});

const NotificationsDiscord: React.FC = () => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const { data, error, revalidate } = useSWR(
    '/api/v1/settings/notifications/discord'
  );

  const NotificationsDiscordSchema = Yup.object().shape({
    webhookUrl: Yup.string().required(
      intl.formatMessage(messages.validationWebhookUrlRequired)
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
        webhookUrl: data.options.webhookUrl,
      }}
      validationSchema={NotificationsDiscordSchema}
      onSubmit={async (values) => {
        try {
          await axios.post('/api/v1/settings/notifications/discord', {
            enabled: values.enabled,
            types: values.types,
            options: {
              webhookUrl: values.webhookUrl,
            },
          });
          addToast(intl.formatMessage(messages.discordsettingssaved), {
            appearance: 'success',
            autoDismiss: true,
          });
        } catch (e) {
          addToast(intl.formatMessage(messages.discordsettingsfailed), {
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
          await axios.post('/api/v1/settings/notifications/discord/test', {
            enabled: true,
            types: values.types,
            options: {
              webhookUrl: values.webhookUrl,
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
                {intl.formatMessage(messages.webhookUrl)}
              </label>
              <div className="mt-1 sm:mt-0 sm:col-span-2">
                <div className="max-w-lg flex rounded-md shadow-sm">
                  <Field
                    id="webhookUrl"
                    name="webhookUrl"
                    type="text"
                    placeholder={intl.formatMessage(
                      messages.webhookUrlPlaceholder
                    )}
                    className="flex-1 form-input block w-full min-w-0 rounded-md transition duration-150 ease-in-out sm:text-sm sm:leading-5 bg-gray-700 border border-gray-500"
                  />
                </div>
                {errors.webhookUrl && touched.webhookUrl && (
                  <div className="text-red-500 mt-2">{errors.webhookUrl}</div>
                )}
              </div>
            </div>
            <div className="mt-8 border-t border-gray-700 pt-5">
              <div className="flex justify-end">
                <span className="ml-3 inline-flex rounded-md shadow-sm">
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
                <span className="ml-3 inline-flex rounded-md shadow-sm">
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

export default NotificationsDiscord;
