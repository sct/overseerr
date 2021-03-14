import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import { useRouter } from 'next/router';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';
import { UserSettingsNotificationsResponse } from '../../../../../server/interfaces/api/userSettingsInterfaces';
import DiscordLogo from '../../../../assets/extlogos/discord.svg';
import TelegramLogo from '../../../../assets/extlogos/telegram.svg';
import { useUser } from '../../../../hooks/useUser';
import globalMessages from '../../../../i18n/globalMessages';
import Error from '../../../../pages/_error';
import Button from '../../../Common/Button';
import LoadingSpinner from '../../../Common/LoadingSpinner';
import PageTitle from '../../../Common/PageTitle';
import SettingsTabs, { SettingsRoute } from '../../../Common/SettingsTabs';

const messages = defineMessages({
  notifications: 'Notifications',
  notificationsettings: 'Notification Settings',
  notificationAgentsSettings: 'Notification Agents',
  enableNotifications: 'Enable Notifications',
  email: 'Email',
  toastSettingsSuccess: 'Notification settings saved successfully!',
  toastSettingsFailure: 'Something went wrong while saving settings.',
});

const UserNotificationSettings: React.FC = ({ children }) => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const router = useRouter();
  const { user, mutate } = useUser({ id: Number(router.query.userId) });
  const { data, error, revalidate } = useSWR<UserSettingsNotificationsResponse>(
    user ? `/api/v1/user/${user?.id}/settings/notifications` : null
  );

  const settingsRoutes: SettingsRoute[] = [
    {
      text: intl.formatMessage(messages.email),
      content: (
        <span className="flex items-center">
          <svg
            className="h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
            />
          </svg>
          {intl.formatMessage(messages.email)}
        </span>
      ),
      route: `/users/${user?.id}/settings/notifications/email`,
      regex: /\/settings\/notifications\/email/,
    },
    {
      text: 'Discord',
      content: (
        <span className="flex items-center">
          <DiscordLogo className="h-4 mr-2" />
          Discord
        </span>
      ),
      route: `/users/${user?.id}/settings/notifications/discord`,
      regex: /\/settings\/notifications\/discord/,
    },
    {
      text: 'Telegram',
      content: (
        <span className="flex items-center">
          <TelegramLogo className="h-4 mr-2" />
          Telegram
        </span>
      ),
      route: `/users/${user?.id}/settings/notifications/telegram`,
      regex: /\/settings\/notifications\/telegram/,
    },
  ];

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <Error statusCode={500} />;
  }

  return (
    <>
      <PageTitle
        title={[
          intl.formatMessage(messages.notifications),
          intl.formatMessage(globalMessages.usersettings),
          user?.displayName,
        ]}
      />
      <div className="mb-6">
        <h3 className="heading">
          {intl.formatMessage(messages.notificationsettings)}
        </h3>
      </div>
      <div className="section">
        <Formik
          initialValues={{
            enableNotifications: data?.enableNotifications,
          }}
          enableReinitialize
          onSubmit={async (values) => {
            try {
              await axios.post(
                `/api/v1/user/${user?.id}/settings/notifications`,
                {
                  enableNotifications: values.enableNotifications,
                }
              );

              addToast(intl.formatMessage(messages.toastSettingsSuccess), {
                autoDismiss: true,
                appearance: 'success',
              });
            } catch (e) {
              addToast(intl.formatMessage(messages.toastSettingsFailure), {
                autoDismiss: true,
                appearance: 'error',
              });
            } finally {
              revalidate();
              mutate();
            }
          }}
        >
          {({ isSubmitting }) => {
            return (
              <Form className="section">
                <div className="form-row">
                  <label
                    htmlFor="enableNotifications"
                    className="checkbox-label"
                  >
                    <span className="mr-2">
                      {intl.formatMessage(messages.enableNotifications)}
                    </span>
                  </label>
                  <div className="form-input">
                    <Field
                      type="checkbox"
                      id="enableNotifications"
                      name="enableNotifications"
                    />
                  </div>
                </div>
                <div className="actions">
                  <div className="flex justify-end">
                    <span className="inline-flex ml-3 rounded-md shadow-sm">
                      <Button
                        buttonType="primary"
                        type="submit"
                        disabled={isSubmitting}
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
      </div>
      <div className="mt-10 mb-6">
        <h3 className="heading">
          {intl.formatMessage(messages.notificationAgentsSettings)}
        </h3>
      </div>
      <SettingsTabs tabType="button" settingsRoutes={settingsRoutes} />
      <div className="section">{children}</div>
    </>
  );
};

export default UserNotificationSettings;
