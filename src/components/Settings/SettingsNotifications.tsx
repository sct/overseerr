import { CloudIcon, LightningBoltIcon, MailIcon } from '@heroicons/react/solid';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import DiscordLogo from '../../assets/extlogos/discord.svg';
import GotifyLogo from '../../assets/extlogos/gotify.svg';
import LunaSeaLogo from '../../assets/extlogos/lunasea.svg';
import PushbulletLogo from '../../assets/extlogos/pushbullet.svg';
import PushoverLogo from '../../assets/extlogos/pushover.svg';
import SlackLogo from '../../assets/extlogos/slack.svg';
import TelegramLogo from '../../assets/extlogos/telegram.svg';
import globalMessages from '../../i18n/globalMessages';
import PageTitle from '../Common/PageTitle';
import SettingsTabs, { SettingsRoute } from '../Common/SettingsTabs';

const messages = defineMessages({
  notifications: 'Notifications',
  notificationsettings: 'Notification Settings',
  notificationAgentSettingsDescription:
    'Configure and enable notification agents.',
  email: 'Email',
  webhook: 'Webhook',
  webpush: 'Web Push',
});

const SettingsNotifications: React.FC = ({ children }) => {
  const intl = useIntl();

  const settingsRoutes: SettingsRoute[] = [
    {
      text: intl.formatMessage(messages.email),
      content: (
        <span className="flex items-center">
          <MailIcon className="mr-2 h-4" />
          {intl.formatMessage(messages.email)}
        </span>
      ),
      route: '/settings/notifications/email',
      regex: /^\/settings\/notifications\/email/,
    },
    {
      text: intl.formatMessage(messages.webpush),
      content: (
        <span className="flex items-center">
          <CloudIcon className="mr-2 h-4" />
          {intl.formatMessage(messages.webpush)}
        </span>
      ),
      route: '/settings/notifications/webpush',
      regex: /^\/settings\/notifications\/webpush/,
    },
    {
      text: 'Discord',
      content: (
        <span className="flex items-center">
          <DiscordLogo className="mr-2 h-4" />
          Discord
        </span>
      ),
      route: '/settings/notifications/discord',
      regex: /^\/settings\/notifications\/discord/,
    },
    {
      text: 'Gotify',
      content: (
        <span className="flex items-center">
          <GotifyLogo className="mr-2 h-4" />
          Gotify
        </span>
      ),
      route: '/settings/notifications/gotify',
      regex: /^\/settings\/notifications\/gotify/,
    },
    {
      text: 'LunaSea',
      content: (
        <span className="flex items-center">
          <LunaSeaLogo className="mr-2 h-4" />
          LunaSea
        </span>
      ),
      route: '/settings/notifications/lunasea',
      regex: /^\/settings\/notifications\/lunasea/,
    },
    {
      text: 'Pushbullet',
      content: (
        <span className="flex items-center">
          <PushbulletLogo className="mr-2 h-4" />
          Pushbullet
        </span>
      ),
      route: '/settings/notifications/pushbullet',
      regex: /^\/settings\/notifications\/pushbullet/,
    },
    {
      text: 'Pushover',
      content: (
        <span className="flex items-center">
          <PushoverLogo className="mr-2 h-4" />
          Pushover
        </span>
      ),
      route: '/settings/notifications/pushover',
      regex: /^\/settings\/notifications\/pushover/,
    },
    {
      text: 'Slack',
      content: (
        <span className="flex items-center">
          <SlackLogo className="mr-2 h-4" />
          Slack
        </span>
      ),
      route: '/settings/notifications/slack',
      regex: /^\/settings\/notifications\/slack/,
    },
    {
      text: 'Telegram',
      content: (
        <span className="flex items-center">
          <TelegramLogo className="mr-2 h-4" />
          Telegram
        </span>
      ),
      route: '/settings/notifications/telegram',
      regex: /^\/settings\/notifications\/telegram/,
    },
    {
      text: intl.formatMessage(messages.webhook),
      content: (
        <span className="flex items-center">
          <LightningBoltIcon className="mr-2 h-4" />
          {intl.formatMessage(messages.webhook)}
        </span>
      ),
      route: '/settings/notifications/webhook',
      regex: /^\/settings\/notifications\/webhook/,
    },
  ];

  return (
    <>
      <PageTitle
        title={[
          intl.formatMessage(messages.notifications),
          intl.formatMessage(globalMessages.settings),
        ]}
      />
      <div className="mb-6">
        <h3 className="heading">
          {intl.formatMessage(messages.notificationsettings)}
        </h3>
        <p className="description">
          {intl.formatMessage(messages.notificationAgentSettingsDescription)}
        </p>
      </div>
      <SettingsTabs tabType="button" settingsRoutes={settingsRoutes} />
      <div className="section">{children}</div>
    </>
  );
};

export default SettingsNotifications;
