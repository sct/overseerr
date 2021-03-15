import { useRouter } from 'next/router';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';
import { UserSettingsNotificationsResponse } from '../../../../../server/interfaces/api/userSettingsInterfaces';
import DiscordLogo from '../../../../assets/extlogos/discord.svg';
import TelegramLogo from '../../../../assets/extlogos/telegram.svg';
import useSettings from '../../../../hooks/useSettings';
import { useUser } from '../../../../hooks/useUser';
import globalMessages from '../../../../i18n/globalMessages';
import Error from '../../../../pages/_error';
import LoadingSpinner from '../../../Common/LoadingSpinner';
import PageTitle from '../../../Common/PageTitle';
import SettingsTabs, { SettingsRoute } from '../../../Common/SettingsTabs';

const messages = defineMessages({
  notifications: 'Notifications',
  notificationsettings: 'Notification Settings',
  email: 'Email',
  toastSettingsSuccess: 'Notification settings saved successfully!',
  toastSettingsFailure: 'Something went wrong while saving settings.',
});

const UserNotificationSettings: React.FC = ({ children }) => {
  const intl = useIntl();
  const router = useRouter();
  const settings = useSettings();
  const { user } = useUser({ id: Number(router.query.userId) });
  const { data, error } = useSWR<UserSettingsNotificationsResponse>(
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
      hidden:
        !settings.currentSettings.notificationsEnabled ||
        !settings.currentSettings.emailEnabled,
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
      hidden:
        !settings.currentSettings.notificationsEnabled ||
        !settings.currentSettings.telegramEnabled,
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
      <SettingsTabs tabType="button" settingsRoutes={settingsRoutes} />
      <div className="section">{children}</div>
    </>
  );
};

export default UserNotificationSettings;
