import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import React from 'react';
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
  webhookUrl: 'Webhook URL',
  slacksettingssaved: 'Slack notification settings saved successfully!',
  slacksettingsfailed: 'Slack notification settings failed to save.',
  testsent: 'Slack test notification sent!',
  settingupslackDescription:
    'To configure Slack notifications, you will need to create an <WebhookLink>Incoming Webhook</WebhookLink> integration and enter the webhook URL below.',
  validationWebhookUrl: 'You must provide a valid URL',
});

const NotificationsSlack: React.FC = () => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const { data, error, revalidate } = useSWR(
    '/api/v1/settings/notifications/slack'
  );

  const NotificationsSlackSchema = Yup.object().shape({
    webhookUrl: Yup.string()
      .when('enabled', {
        is: true,
        then: Yup.string()
          .nullable()
          .required(intl.formatMessage(messages.validationWebhookUrl)),
        otherwise: Yup.string().nullable(),
      })
      .url(intl.formatMessage(messages.validationWebhookUrl)),
  });

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Alert
        title={intl.formatMessage(messages.settingupslackDescription, {
          WebhookLink: function WebhookLink(msg) {
            return (
              <a
                href="https://my.slack.com/services/new/incoming-webhook/"
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
      <Formik
        initialValues={{
          enabled: data.enabled,
          types: data.types,
          webhookUrl: data.options.webhookUrl,
        }}
        validationSchema={NotificationsSlackSchema}
        onSubmit={async (values) => {
          try {
            await axios.post('/api/v1/settings/notifications/slack', {
              enabled: values.enabled,
              types: values.types,
              options: {
                webhookUrl: values.webhookUrl,
              },
            });
            addToast(intl.formatMessage(messages.slacksettingssaved), {
              appearance: 'success',
              autoDismiss: true,
            });
          } catch (e) {
            addToast(intl.formatMessage(messages.slacksettingsfailed), {
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
        }) => {
          const testSettings = async () => {
            await axios.post('/api/v1/settings/notifications/slack/test', {
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
            <Form className="section">
              <div className="form-row">
                <label htmlFor="isDefault" className="checkbox-label">
                  {intl.formatMessage(messages.agentenabled)}
                </label>
                <div className="form-input">
                  <Field type="checkbox" id="enabled" name="enabled" />
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="name" className="text-label">
                  {intl.formatMessage(messages.webhookUrl)}
                  <span className="label-required">*</span>
                </label>
                <div className="form-input">
                  <div className="form-input-field">
                    <Field id="webhookUrl" name="webhookUrl" type="text" />
                  </div>
                  {errors.webhookUrl && touched.webhookUrl && (
                    <div className="error">{errors.webhookUrl}</div>
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
                      disabled={isSubmitting || !isValid}
                      onClick={(e) => {
                        e.preventDefault();

                        testSettings();
                      }}
                    >
                      {intl.formatMessage(globalMessages.test)}
                    </Button>
                  </span>
                  <span className="inline-flex ml-3 rounded-md shadow-sm">
                    <Button
                      buttonType="primary"
                      type="submit"
                      disabled={isSubmitting || !isValid}
                    >
                      {isSubmitting
                        ? intl.formatMessage(globalMessages.saving)
                        : intl.formatMessage(globalMessages.save)}
                    </Button>
                  </span>
                </div>
              </div>
            </Form>
          );
        }}
      </Formik>
    </>
  );
};

export default NotificationsSlack;
