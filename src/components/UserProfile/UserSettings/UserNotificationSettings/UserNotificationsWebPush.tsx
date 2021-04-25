import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import { useRouter } from 'next/router';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';
import { UserSettingsNotificationsResponse } from '../../../../../server/interfaces/api/userSettingsInterfaces';
import { useUser } from '../../../../hooks/useUser';
import globalMessages from '../../../../i18n/globalMessages';
import Button from '../../../Common/Button';
import LoadingSpinner from '../../../Common/LoadingSpinner';
import { ALL_NOTIFICATIONS } from '../../../NotificationTypeSelector';

const messages = defineMessages({
  webpushsettingssaved: 'Web push notification settings saved successfully!',
  webpushsettingsfailed: 'Web push notification settings failed to save.',
  enableWebPush: 'Enable Notifications',
});

const UserWebPushSettings: React.FC = () => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const router = useRouter();
  const { user } = useUser({ id: Number(router.query.userId) });
  const { data, error, revalidate } = useSWR<UserSettingsNotificationsResponse>(
    user ? `/api/v1/user/${user?.id}/settings/notifications` : null
  );

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  return (
    <Formik
      initialValues={{
        enableWebPush: !!(data?.notificationTypes.webpush ?? true),
        pgpKey: data?.pgpKey,
      }}
      enableReinitialize
      onSubmit={async (values) => {
        try {
          await axios.post(`/api/v1/user/${user?.id}/settings/notifications`, {
            discordId: data?.discordId,
            telegramChatId: data?.telegramChatId,
            telegramSendSilently: data?.telegramSendSilently,
            notificationTypes: {
              webpush: values.enableWebPush ? ALL_NOTIFICATIONS : 0,
            },
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
      {({ isSubmitting, isValid }) => {
        return (
          <Form className="section">
            <div className="form-row">
              <label htmlFor="enableEmail" className="checkbox-label">
                {intl.formatMessage(messages.enableWebPush)}
              </label>
              <div className="form-input">
                <Field
                  type="checkbox"
                  id="enableWebPush"
                  name="enableWebPush"
                />
              </div>
            </div>
            <div className="actions">
              <div className="flex justify-end">
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

export default UserWebPushSettings;
