import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';
import globalMessages from '../../../../i18n/globalMessages';
import Button from '../../../Common/Button';
import LoadingSpinner from '../../../Common/LoadingSpinner';
import NotificationTypeSelector from '../../../NotificationTypeSelector';

const messages = defineMessages({
  agentenabled: 'Enable Agent',
  webpushsettingssaved: 'Web push notification settings saved successfully!',
  webpushsettingsfailed: 'Web push notification settings failed to save.',
  testsent: 'Web push test notification sent!',
});

const NotificationsWebPush: React.FC = () => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const { data, error, revalidate } = useSWR(
    '/api/v1/settings/notifications/webpush'
  );

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Formik
        initialValues={{
          enabled: data.enabled,
          types: data.types,
        }}
        onSubmit={async (values) => {
          try {
            await axios.post('/api/v1/settings/notifications/webpush', {
              enabled: values.enabled,
              types: values.types,
              options: {},
            });
            addToast(intl.formatMessage(messages.webpushsettingssaved), {
              appearance: 'success',
              autoDismiss: true,
            });
          } catch (e) {
            addToast(intl.formatMessage(messages.webpushsettingsfailed), {
              appearance: 'error',
              autoDismiss: true,
            });
          } finally {
            revalidate();
          }
        }}
      >
        {({ isSubmitting, values, isValid, setFieldValue }) => {
          const testSettings = async () => {
            await axios.post('/api/v1/settings/notifications/webpush/test', {
              enabled: true,
              types: values.types,
              options: {},
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

export default NotificationsWebPush;
