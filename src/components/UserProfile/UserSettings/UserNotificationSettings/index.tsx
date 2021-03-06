import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import { useRouter } from 'next/router';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';
import { useUser } from '../../../../hooks/useUser';
import Error from '../../../../pages/_error';
import Button from '../../../Common/Button';
import LoadingSpinner from '../../../Common/LoadingSpinner';
import { UserSettingsNotificationsResponse } from '../../../../../server/interfaces/api/userSettingsInterfaces';
import * as Yup from 'yup';

const messages = defineMessages({
  notificationsettings: 'Notification Settings',
  enableNotifications: 'Enable Notifications',
  discordId: 'Discord User ID',
  discordIdTip:
    'The <FindDiscordIdLink>ID number</FindDiscordIdLink> for your Discord user account',
  validationDiscordId: 'You must provide a valid Discord user ID',
  telegramChatId: 'Telegram Chat ID',
  telegramChatIdTip: 'Add <GetIdBotLink>@get_id_bot</GetIdBotLink> to the chat',
  telegramChatIdTipLong:
    '<TelegramBotLink>Start a chat</TelegramBotLink>, add <GetIdBotLink>@get_id_bot</GetIdBotLink>, and issue the <code>/my_id</code> command',
  sendSilently: 'Send Telegram Messages Silently',
  sendSilentlyDescription: 'Send notifications with no sound',
  validationTelegramChatId: 'You must provide a valid Telegram chat ID',
  save: 'Save Changes',
  saving: 'Saving…',
  plexuser: 'Plex User',
  localuser: 'Local User',
  toastSettingsSuccess: 'Settings successfully saved!',
  toastSettingsFailure: 'Something went wrong while saving settings.',
});

const UserNotificationSettings: React.FC = () => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const router = useRouter();
  const { user, mutate } = useUser({ id: Number(router.query.userId) });
  const { data, error, revalidate } = useSWR<UserSettingsNotificationsResponse>(
    user ? `/api/v1/user/${user?.id}/settings/notifications` : null
  );

  const UserNotificationSettingsSchema = Yup.object().shape({
    discordId: Yup.string()
      .nullable()
      .matches(/^\d{17,18}$/, intl.formatMessage(messages.validationDiscordId)),
    telegramChatId: Yup.string()
      .nullable()
      .matches(
        /^[-]?\d+$/,
        intl.formatMessage(messages.validationTelegramChatId)
      ),
  });

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <Error statusCode={500} />;
  }

  return (
    <>
      <div className="mb-6">
        <h3 className="heading">
          {intl.formatMessage(messages.notificationsettings)}
        </h3>
      </div>
      <Formik
        initialValues={{
          enableNotifications: data?.enableNotifications,
          discordId: data?.discordId,
          telegramChatId: data?.telegramChatId,
          telegramSendSilently: data?.telegramSendSilently,
        }}
        validationSchema={UserNotificationSettingsSchema}
        enableReinitialize
        onSubmit={async (values) => {
          try {
            await axios.post(
              `/api/v1/user/${user?.id}/settings/notifications`,
              {
                enableNotifications: values.enableNotifications,
                discordId: values.discordId,
                telegramChatId: values.telegramChatId,
                telegramSendSilently: values.telegramSendSilently,
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
        {({ errors, touched, isSubmitting }) => {
          return (
            <Form className="section">
              <div className="form-row">
                <label htmlFor="enableNotifications" className="checkbox-label">
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
              <div className="form-row">
                <label htmlFor="discordId" className="text-label">
                  <span>{intl.formatMessage(messages.discordId)}</span>
                  <span className="label-tip">
                    {intl.formatMessage(messages.discordIdTip, {
                      FindDiscordIdLink: function FindDiscordIdLink(msg) {
                        return (
                          <a
                            href="https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-"
                            target="_blank"
                            rel="noreferrer"
                            className="text-gray-100 underline transition duration-300 hover:text-white"
                          >
                            {msg}
                          </a>
                        );
                      },
                    })}
                  </span>
                </label>
                <div className="form-input">
                  <div className="flex max-w-lg rounded-md shadow-sm">
                    <Field id="discordId" name="discordId" type="text" />
                  </div>
                  {errors.discordId && touched.discordId && (
                    <div className="error">{errors.discordId}</div>
                  )}
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="telegramChatId" className="text-label">
                  <span>{intl.formatMessage(messages.telegramChatId)}</span>
                  <span className="label-tip">
                    {data?.telegramBotUsername
                      ? intl.formatMessage(messages.telegramChatIdTipLong, {
                          TelegramBotLink: function TelegramBotLink(msg) {
                            return (
                              <a
                                href={`https://telegram.me/${data.telegramBotUsername}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-gray-100 underline transition duration-300 hover:text-white"
                              >
                                {msg}
                              </a>
                            );
                          },
                          GetIdBotLink: function GetIdBotLink(msg) {
                            return (
                              <a
                                href="https://telegram.me/get_id_bot"
                                className="text-gray-100 underline transition duration-300 hover:text-white"
                                target="_blank"
                                rel="noreferrer"
                              >
                                {msg}
                              </a>
                            );
                          },
                          code: function code(msg) {
                            return <code>{msg}</code>;
                          },
                        })
                      : intl.formatMessage(messages.telegramChatIdTip, {
                          GetIdBotLink: function GetIdBotLink(msg) {
                            return (
                              <a
                                href="https://telegram.me/get_id_bot"
                                className="text-gray-100 underline transition duration-300 hover:text-white"
                                target="_blank"
                                rel="noreferrer"
                              >
                                {msg}
                              </a>
                            );
                          },
                        })}
                  </span>
                </label>
                <div className="form-input">
                  <div className="flex max-w-lg rounded-md shadow-sm">
                    <Field
                      id="telegramChatId"
                      name="telegramChatId"
                      type="text"
                    />
                  </div>
                  {errors.telegramChatId && touched.telegramChatId && (
                    <div className="error">{errors.telegramChatId}</div>
                  )}
                </div>
              </div>
              <div className="form-row">
                <label
                  htmlFor="telegramSendSilently"
                  className="checkbox-label"
                >
                  <span className="mr-2">
                    {intl.formatMessage(messages.sendSilently)}
                  </span>
                  <span className="label-tip">
                    {intl.formatMessage(messages.sendSilentlyDescription)}
                  </span>
                </label>
                <div className="form-input">
                  <Field
                    type="checkbox"
                    id="telegramSendSilently"
                    name="telegramSendSilently"
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
                        ? intl.formatMessage(messages.saving)
                        : intl.formatMessage(messages.save)}
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

export default UserNotificationSettings;
