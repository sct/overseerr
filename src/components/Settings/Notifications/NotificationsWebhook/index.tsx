import { BeakerIcon, SaveIcon } from '@heroicons/react/outline';
import { QuestionMarkCircleIcon, RefreshIcon } from '@heroicons/react/solid';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import React, { useState } from 'react';
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
  event: '{{event}}',
  subject: '{{subject}}',
  message: '{{message}}',
  image: '{{image}}',
  '{{media}}': {
    media_type: '{{media_type}}',
    tmdbId: '{{media_tmdbid}}',
    tvdbId: '{{media_tvdbid}}',
    status: '{{media_status}}',
    status4k: '{{media_status4k}}',
  },
  '{{request}}': {
    request_id: '{{request_id}}',
    requestedBy_email: '{{requestedBy_email}}',
    requestedBy_username: '{{requestedBy_username}}',
    requestedBy_avatar: '{{requestedBy_avatar}}',
  },
  '{{issue}}': {
    issue_id: '{{issue_id}}',
    issue_type: '{{issue_type}}',
    issue_status: '{{issue_status}}',
    reportedBy_email: '{{reportedBy_email}}',
    reportedBy_username: '{{reportedBy_username}}',
    reportedBy_avatar: '{{reportedBy_avatar}}',
  },
  '{{comment}}': {
    comment_message: '{{comment_message}}',
    commentedBy_email: '{{commentedBy_email}}',
    commentedBy_username: '{{commentedBy_username}}',
    commentedBy_avatar: '{{commentedBy_avatar}}',
  },
  '{{extra}}': [],
};

const messages = defineMessages({
  agentenabled: 'Enable Agent',
  webhookUrl: 'Webhook URL',
  authheader: 'Authorization Header',
  validationJsonPayloadRequired: 'You must provide a valid JSON payload',
  webhooksettingssaved: 'Webhook notification settings saved successfully!',
  webhooksettingsfailed: 'Webhook notification settings failed to save.',
  toastWebhookTestSending: 'Sending webhook test notification…',
  toastWebhookTestSuccess: 'Webhook test notification sent!',
  toastWebhookTestFailed: 'Webhook test notification failed to send.',
  resetPayload: 'Reset to Default',
  resetPayloadSuccess: 'JSON payload reset successfully!',
  customJson: 'JSON Payload',
  templatevariablehelp: 'Template Variable Help',
  validationWebhookUrl: 'You must provide a valid URL',
  validationTypes: 'You must select at least one notification type',
});

const NotificationsWebhook: React.FC = () => {
  const intl = useIntl();
  const { addToast, removeToast } = useToasts();
  const [isTesting, setIsTesting] = useState(false);
  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR('/api/v1/settings/notifications/webhook');

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
          setIsTesting(true);
          let toastId: string | undefined;
          try {
            addToast(
              intl.formatMessage(messages.toastWebhookTestSending),
              {
                autoDismiss: false,
                appearance: 'info',
              },
              (id) => {
                toastId = id;
              }
            );
            await axios.post('/api/v1/settings/notifications/webhook/test', {
              enabled: true,
              types: values.types,
              options: {
                webhookUrl: values.webhookUrl,
                jsonPayload: JSON.stringify(values.jsonPayload),
                authHeader: values.authHeader,
              },
            });

            if (toastId) {
              removeToast(toastId);
            }
            addToast(intl.formatMessage(messages.toastWebhookTestSuccess), {
              autoDismiss: true,
              appearance: 'success',
            });
          } catch (e) {
            if (toastId) {
              removeToast(toastId);
            }
            addToast(intl.formatMessage(messages.toastWebhookTestFailed), {
              autoDismiss: true,
              appearance: 'error',
            });
          } finally {
            setIsTesting(false);
          }
        };

        return (
          <Form className="section">
            <div className="form-row">
              <label htmlFor="enabled" className="checkbox-label">
                {intl.formatMessage(messages.agentenabled)}
                <span className="label-required">*</span>
              </label>
              <div className="form-input-area">
                <Field type="checkbox" id="enabled" name="enabled" />
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="webhookUrl" className="text-label">
                {intl.formatMessage(messages.webhookUrl)}
                <span className="label-required">*</span>
              </label>
              <div className="form-input-area">
                <div className="form-input-field">
                  <Field
                    id="webhookUrl"
                    name="webhookUrl"
                    type="text"
                    inputMode="url"
                  />
                </div>
                {errors.webhookUrl && touched.webhookUrl && (
                  <div className="error">{errors.webhookUrl}</div>
                )}
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="authHeader" className="text-label">
                {intl.formatMessage(messages.authheader)}
              </label>
              <div className="form-input-area">
                <div className="form-input-field">
                  <Field id="authHeader" name="authHeader" type="text" />
                </div>
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="webhook-json-payload" className="text-label">
                {intl.formatMessage(messages.customJson)}
                <span className="label-required">*</span>
              </label>
              <div className="form-input-area">
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
                    <RefreshIcon />
                    <span>{intl.formatMessage(messages.resetPayload)}</span>
                  </Button>
                  <Link
                    href="https://docs.overseerr.dev/using-overseerr/notifications/webhooks#template-variables"
                    passHref
                  >
                    <Button
                      as="a"
                      buttonSize="sm"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <QuestionMarkCircleIcon />
                      <span>
                        {intl.formatMessage(messages.templatevariablehelp)}
                      </span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            <NotificationTypeSelector
              currentTypes={values.enabled ? values.types : 0}
              onUpdate={(newTypes) => {
                setFieldValue('types', newTypes);
                setFieldTouched('types');

                if (newTypes) {
                  setFieldValue('enabled', true);
                }
              }}
              error={
                values.enabled && !values.types && touched.types
                  ? intl.formatMessage(messages.validationTypes)
                  : undefined
              }
            />
            <div className="actions">
              <div className="flex justify-end">
                <span className="ml-3 inline-flex rounded-md shadow-sm">
                  <Button
                    buttonType="warning"
                    disabled={isSubmitting || !isValid || isTesting}
                    onClick={(e) => {
                      e.preventDefault();
                      testSettings();
                    }}
                  >
                    <BeakerIcon />
                    <span>
                      {isTesting
                        ? intl.formatMessage(globalMessages.testing)
                        : intl.formatMessage(globalMessages.test)}
                    </span>
                  </Button>
                </span>
                <span className="ml-3 inline-flex rounded-md shadow-sm">
                  <Button
                    buttonType="primary"
                    type="submit"
                    disabled={
                      isSubmitting ||
                      !isValid ||
                      isTesting ||
                      (values.enabled && !values.types)
                    }
                  >
                    <SaveIcon />
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
  );
};

export default NotificationsWebhook;
