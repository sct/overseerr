import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';
import Bolt from '../../assets/bolt.svg';
import DiscordLogo from '../../assets/extlogos/discord.svg';
import PushbulletLogo from '../../assets/extlogos/pushbullet.svg';
import PushoverLogo from '../../assets/extlogos/pushover.svg';
import SlackLogo from '../../assets/extlogos/slack.svg';
import TelegramLogo from '../../assets/extlogos/telegram.svg';
import globalMessages from '../../i18n/globalMessages';
import Error from '../../pages/_error';
import Button from '../Common/Button';
import LoadingSpinner from '../Common/LoadingSpinner';
import PageTitle from '../Common/PageTitle';
import SettingsTabs, { SettingsRoute } from '../Common/SettingsTabs';

const messages = defineMessages({
  notifications: 'Notifications',
  notificationsettings: 'Notification Settings',
  notificationsettingsDescription:
    'Configure global notification settings. The options below will apply to all notification agents.',
  notificationAgentsSettings: 'Notification Agents',
  notificationAgentSettingsDescription:
    'Choose the types of notifications to send, and which notification agents to use.',
  notificationsettingssaved: 'Notification settings saved successfully!',
  notificationsettingsfailed: 'Notification settings failed to save.',
  enablenotifications: 'Enable Notifications',
  email: 'Email',
  webhook: 'Webhook',
});

const SettingsNotifications: React.FC = ({ children }) => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const { data, error, revalidate } = useSWR('/api/v1/settings/notifications');

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
      route: '/settings/notifications/email',
      regex: /^\/settings\/notifications\/email/,
    },
    {
      text: 'Discord',
      content: (
        <span className="flex items-center">
          <DiscordLogo className="h-4 mr-2" />
          Discord
        </span>
      ),
      route: '/settings/notifications/discord',
      regex: /^\/settings\/notifications\/discord/,
    },
    {
      text: 'Pushbullet',
      content: (
        <span className="flex items-center">
          <PushbulletLogo className="h-4 mr-2" />
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
          <PushoverLogo className="h-4 mr-2" />
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
          <SlackLogo className="h-4 mr-2" />
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
          <TelegramLogo className="h-4 mr-2" />
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
          <Bolt className="h-4 mr-2" />
          {intl.formatMessage(messages.webhook)}
        </span>
      ),
      route: '/settings/notifications/webhook',
      regex: /^\/settings\/notifications\/webhook/,
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
          intl.formatMessage(globalMessages.settings),
        ]}
      />
      <div className="mb-6">
        <h3 className="heading">
          {intl.formatMessage(messages.notificationsettings)}
        </h3>
        <p className="description">
          {intl.formatMessage(messages.notificationsettingsDescription)}
        </p>
      </div>
      <div className="section">
        <Formik
          initialValues={{
            enabled: data.enabled,
          }}
          enableReinitialize
          onSubmit={async (values) => {
            try {
              await axios.post('/api/v1/settings/notifications', {
                enabled: values.enabled,
              });
              addToast(intl.formatMessage(messages.notificationsettingssaved), {
                appearance: 'success',
                autoDismiss: true,
              });
            } catch (e) {
              addToast(
                intl.formatMessage(messages.notificationsettingsfailed),
                {
                  appearance: 'error',
                  autoDismiss: true,
                }
              );
            } finally {
              revalidate();
            }
          }}
        >
          {({ isSubmitting, values, setFieldValue }) => {
            return (
              <Form className="section">
                <div className="form-row">
                  <label htmlFor="name" className="checkbox-label">
                    <span>
                      {intl.formatMessage(messages.enablenotifications)}
                    </span>
                  </label>
                  <div className="form-input">
                    <Field
                      type="checkbox"
                      id="enabled"
                      name="enabled"
                      onChange={() => {
                        setFieldValue('enabled', !values.enabled);
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
