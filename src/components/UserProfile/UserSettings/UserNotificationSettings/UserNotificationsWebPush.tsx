import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import { useRouter } from 'next/router';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';
import { UserSettingsNotificationsResponse } from '../../../../../server/interfaces/api/userSettingsInterfaces';
import {
  hasNotificationAgentEnabled,
  NotificationAgentType,
} from '../../../../../server/lib/notifications/agenttypes';
import { useUser } from '../../../../hooks/useUser';
import globalMessages from '../../../../i18n/globalMessages';
import Button from '../../../Common/Button';
import LoadingSpinner from '../../../Common/LoadingSpinner';

const messages = defineMessages({
  emailsettingssaved: 'Web Push notification settings saved successfully!',
  emailsettingsfailed: 'Web Push notification settings failed to save.',
  enableWebPush: 'Enable Web Push',
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
        notificationAgents:
          data?.notificationAgents ?? NotificationAgentType.WEBPUSH,
        enableEmail: hasNotificationAgentEnabled(
          NotificationAgentType.WEBPUSH,
          data?.notificationAgents ?? NotificationAgentType.WEBPUSH
        ),
        pgpKey: data?.pgpKey,
      }}
      enableReinitialize
      onSubmit={async (values) => {
        try {
          await axios.post(`/api/v1/user/${user?.id}/settings/notifications`, {
            notificationAgents: values.notificationAgents,
            discordId: data?.discordId,
            telegramChatId: data?.telegramChatId,
            telegramSendSilently: data?.telegramSendSilently,
          });
          addToast(intl.formatMessage(messages.emailsettingssaved), {
            appearance: 'success',
            autoDismiss: true,
          });
        } catch (e) {
          addToast(intl.formatMessage(messages.emailsettingsfailed), {
            appearance: 'error',
            autoDismiss: true,
          });
        } finally {
          revalidate();
        }
      }}
    >
      {({ isSubmitting, isValid, values, setFieldValue }) => {
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
                  checked={hasNotificationAgentEnabled(
                    NotificationAgentType.EMAIL,
                    values.notificationAgents
                  )}
                  onChange={() => {
                    setFieldValue(
                      'notificationAgents',
                      hasNotificationAgentEnabled(
                        NotificationAgentType.EMAIL,
                        values.notificationAgents
                      )
                        ? values.notificationAgents -
                            NotificationAgentType.EMAIL
                        : values.notificationAgents +
                            NotificationAgentType.EMAIL
                    );
                  }}
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
