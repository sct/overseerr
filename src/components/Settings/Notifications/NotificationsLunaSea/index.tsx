import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';
import * as Yup from 'yup';
import globalMessages from '../../../../i18n/globalMessages';
import Button from '../../../Common/Button';
import LoadingSpinner from '../../../Common/LoadingSpinner';
import NotificationTypeSelector from '../../../NotificationTypeSelector';

const messages = defineMessages({
  agentenabled: 'Enable Agent',
  webhookUrl: 'Webhook URL',
  validationWebhookUrl: 'You must provide a valid URL',
  profileName: 'Profile Name',
  profileNameTip: 'Only required if not using the <code>default</code> profile',
  settingsSaved: 'LunaSea notification settings saved successfully!',
  settingsFailed: 'LunaSea notification settings failed to save.',
  testSent: 'LunaSea test notification sent!',
});

const NotificationsLunaSea: React.FC = () => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const { data, error, revalidate } = useSWR(
    '/api/v1/settings/notifications/lunasea'
  );

  const NotificationsLunaSeaSchema = Yup.object().shape({
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
    <Formik
      initialValues={{
        enabled: data.enabled,
        types: data.types,
        webhookUrl: data.options.webhookUrl,
        profileName: data.options.profileName,
      }}
      validationSchema={NotificationsLunaSeaSchema}
      onSubmit={async (values) => {
        try {
          await axios.post('/api/v1/settings/notifications/lunasea', {
            enabled: values.enabled,
            types: values.types,
            options: {
              webhookUrl: values.webhookUrl,
              profileName: values.profileName,
            },
          });
          addToast(intl.formatMessage(messages.settingsSaved), {
            appearance: 'success',
            autoDismiss: true,
          });
        } catch (e) {
          addToast(intl.formatMessage(messages.settingsFailed), {
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
          await axios.post('/api/v1/settings/notifications/lunasea/test', {
            enabled: true,
            types: values.types,
            options: {
              webhookUrl: values.webhookUrl,
              profileName: values.profileName,
            },
          });

          addToast(intl.formatMessage(messages.testSent), {
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
              <label htmlFor="profileName" className="text-label">
                {intl.formatMessage(messages.profileName)}
                <span className="label-tip">
                  {intl.formatMessage(messages.profileNameTip, {
                    code: function code(msg) {
                      return <code className="bg-opacity-50">{msg}</code>;
                    },
                  })}
                </span>
              </label>
              <div className="form-input">
                <div className="form-input-field">
                  <Field id="profileName" name="profileName" type="text" />
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

export default NotificationsLunaSea;
