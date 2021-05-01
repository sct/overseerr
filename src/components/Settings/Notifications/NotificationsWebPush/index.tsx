import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import React, { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR, { mutate } from 'swr';
import globalMessages from '../../../../i18n/globalMessages';
import Button from '../../../Common/Button';
import LoadingSpinner from '../../../Common/LoadingSpinner';
import NotificationTypeSelector from '../../../NotificationTypeSelector';

const messages = defineMessages({
  agentenabled: 'Enable Agent',
  webpushsettingssaved: 'Web push notification settings saved successfully!',
  webpushsettingsfailed: 'Web push notification settings failed to save.',
  toastWebPushTestSending: 'Sending web push test notification…',
  toastWebPushTestSuccess: 'Web push test notification sent!',
  toastWebPushTestFailed: 'Web push test notification failed to send.',
});

const NotificationsWebPush: React.FC = () => {
  const intl = useIntl();
  const { addToast, removeToast } = useToasts();
  const [isTesting, setIsTesting] = useState(false);
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
            mutate('/api/v1/settings/public');
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
            setIsTesting(true);
            let toastId: string | undefined;
            try {
              addToast(
                intl.formatMessage(messages.toastWebPushTestSending),
                {
                  autoDismiss: false,
                  appearance: 'info',
                },
                (id) => {
                  toastId = id;
                }
              );
              await axios.post('/api/v1/settings/notifications/webpush/test', {
                enabled: true,
                types: values.types,
                options: {},
              });

              if (toastId) {
                removeToast(toastId);
              }
              addToast(intl.formatMessage(messages.toastWebPushTestSuccess), {
                autoDismiss: true,
                appearance: 'success',
              });
            } catch (e) {
              if (toastId) {
                removeToast(toastId);
              }
              addToast(intl.formatMessage(messages.toastWebPushTestFailed), {
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
                      disabled={isSubmitting || !isValid || isTesting}
                      onClick={(e) => {
                        e.preventDefault();
                        testSettings();
                      }}
                    >
                      {isTesting
                        ? intl.formatMessage(globalMessages.testing)
                        : intl.formatMessage(globalMessages.test)}
                    </Button>
                  </span>
                  <span className="inline-flex ml-3 rounded-md shadow-sm">
                    <Button
                      buttonType="primary"
                      type="submit"
                      disabled={isSubmitting || !isValid || isTesting}
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
