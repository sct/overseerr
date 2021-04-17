import { QuestionMarkCircleIcon, RefreshIcon } from '@heroicons/react/solid';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import dynamic from 'next/dynamic';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';
import * as Yup from 'yup';
import globalMessages from '../../../../i18n/globalMessages';
import Button from '../../../Common/Button';
import LoadingSpinner from '../../../Common/LoadingSpinner';
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
  '{{request}}': {
    request_id: '{{request_id}}',
    requestedBy_email: '{{requestedBy_email}}',
    requestedBy_username: '{{requestedBy_username}}',
    requestedBy_avatar: '{{requestedBy_avatar}}',
  },
};

const messages = defineMessages({
  agentenabled: 'Enable Agent',
  webhookUrl: 'Webhook URL',
  authheader: 'Authorization Header',
  validationJsonPayloadRequired: 'You must provide a valid JSON payload',
  webhooksettingssaved: 'Webhook notification settings saved successfully!',
  webhooksettingsfailed: 'Webhook notification settings failed to save.',
  testsent: 'Webhook test notification sent!',
  resetPayload: 'Reset to Default',
  resetPayloadSuccess: 'JSON payload reset successfully!',
  customJson: 'JSON Payload',
  templatevariablehelp: 'Template Variable Help',
  validationWebhookUrl: 'You must provide a valid URL',
});

const NotificationsWebhook: React.FC = () => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const { data, error, revalidate } = useSWR(
    '/api/v1/settings/notifications/webhook'
  );

  const NotificationsWebhookSchema = Yup.object().shape({
    webhookUrl: Yup.string()
      .when('enabled', {
        is: true,
        then: Yup.string()
          .nullable()
          .required(intl.formatMessage(messages.validationWebhookUrl)),
        otherwise: Yup.string().nullable(),
      })
      .matches(
        // eslint-disable-next-line no-useless-escape
        /^(https?:)?\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*)?([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i,
        intl.formatMessage(messages.validationWebhookUrl)
      ),
    jsonPayload: Yup.string()
      .when('enabled', {
        is: true,
        then: Yup.string()
          .nullable()
          .required(intl.formatMessage(messages.validationJsonPayloadRequired)),
        otherwise: Yup.string().nullable(),
      })
      .test(
        'validate-json',
        intl.formatMessage(messages.validationJsonPayloadRequired),
        (value) => {
          try {
            JSON.parse(value ?? '');
            return true;
          } catch (e) {
            return false;
          }
        }
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
            <div className="form-row">
              <label htmlFor="name" className="text-label">
                {intl.formatMessage(messages.authheader)}
              </label>
              <div className="form-input">
                <div className="form-input-field">
                  <Field id="authHeader" name="authHeader" type="text" />
                </div>
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="name" className="text-label">
                {intl.formatMessage(messages.customJson)}
                <span className="label-required">*</span>
              </label>
              <div className="form-input">
                <div className="form-input-field">
                  <JSONEditor
                    name="webhook-json-payload"
                    onUpdate={(value) => setFieldValue('jsonPayload', value)}
                    value={values.jsonPayload}
                    onBlur={() => setFieldTouched('jsonPayload')}
                  />
                </div>
                {errors.jsonPayload && touched.jsonPayload && (
                  <div className="error">{errors.jsonPayload}</div>
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
                    <RefreshIcon className="w-5 h-5 mr-1" />
                    {intl.formatMessage(messages.resetPayload)}
                  </Button>
                  <a
                    href="https://docs.overseerr.dev/using-overseerr/notifications/webhooks#template-variables"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center font-medium leading-5 text-white transition duration-150 ease-in-out bg-indigo-600 border border-transparent rounded-md focus:outline-none hover:bg-indigo-500 focus:border-indigo-700 focus:ring-indigo active:bg-indigo-700 disabled:opacity-50 px-2.5 py-1.5 text-xs"
                  >
                    <QuestionMarkCircleIcon className="w-5 h-5 mr-1" />
                    {intl.formatMessage(messages.templatevariablehelp)}
                  </a>
                </div>
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
  );
};

export default NotificationsWebhook;
