import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';
import * as Yup from 'yup';
import globalMessages from '../../../i18n/globalMessages';
import Alert from '../../Common/Alert';
import Button from '../../Common/Button';
import LoadingSpinner from '../../Common/LoadingSpinner';
import NotificationTypeSelector from '../../NotificationTypeSelector';

const messages = defineMessages({
  agentenabled: 'Enable Agent',
  botUsername: 'Bot Username',
  botUsernameTip:
    'Allow users to start a chat with the bot and configure their own personal notifications',
  botAPI: 'Bot Authentication Token',
  chatId: 'Chat ID',
  validationBotAPIRequired: 'You must provide a bot authentication token',
  validationChatIdRequired: 'You must provide a valid chat ID',
  telegramsettingssaved: 'Telegram notification settings saved successfully!',
  telegramsettingsfailed: 'Telegram notification settings failed to save.',
  testsent: 'Telegram test notification sent!',
  settinguptelegram: 'Setting Up Telegram Notifications',
  settinguptelegramDescription:
    'To configure Telegram notifications, you will need to <CreateBotLink>create a bot</CreateBotLink> and get the bot API key. Additionally, you will need the chat ID for the chat to which you would like to send notifications. You can find this by adding <GetIdBotLink>@get_id_bot</GetIdBotLink> to the chat and issuing the <code>/my_id</code> command.',
  sendSilently: 'Send Silently',
  sendSilentlyTip: 'Send notifications with no sound',
});

const NotificationsTelegram: React.FC = () => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const { data, error, revalidate } = useSWR(
    '/api/v1/settings/notifications/telegram'
  );

  const NotificationsTelegramSchema = Yup.object().shape({
    botAPI: Yup.string().when('enabled', {
      is: true,
      then: Yup.string()
        .nullable()
        .required(intl.formatMessage(messages.validationBotAPIRequired)),
      otherwise: Yup.string().nullable(),
    }),
    chatId: Yup.string()
      .when('enabled', {
        is: true,
        then: Yup.string()
          .nullable()
          .required(intl.formatMessage(messages.validationChatIdRequired)),
        otherwise: Yup.string().nullable(),
      })
      .matches(
        /^-?\d+$/,
        intl.formatMessage(messages.validationChatIdRequired)
      ),
  });

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  return (
    <Formik
      initialValues={{
        enabled: data?.enabled,
        types: data?.types,
        botUsername: data?.options.botUsername,
        botAPI: data?.options.botAPI,
        chatId: data?.options.chatId,
        sendSilently: data?.options.sendSilently,
      }}
      validationSchema={NotificationsTelegramSchema}
      onSubmit={async (values) => {
        try {
          await axios.post('/api/v1/settings/notifications/telegram', {
            enabled: values.enabled,
            types: values.types,
            options: {
              botAPI: values.botAPI,
              chatId: values.chatId,
              sendSilently: values.sendSilently,
              botUsername: values.botUsername,
            },
          });
          addToast(intl.formatMessage(messages.telegramsettingssaved), {
            appearance: 'success',
            autoDismiss: true,
          });
        } catch (e) {
          addToast(intl.formatMessage(messages.telegramsettingsfailed), {
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
          await axios.post('/api/v1/settings/notifications/telegram/test', {
            enabled: true,
            types: values.types,
            options: {
              botAPI: values.botAPI,
              chatId: values.chatId,
              sendSilently: values.sendSilently,
              botUsername: values.botUsername,
            },
          });

          addToast(intl.formatMessage(messages.testsent), {
            appearance: 'info',
            autoDismiss: true,
          });
        };

        return (
          <>
            <Alert
              title={intl.formatMessage(messages.settinguptelegram)}
              type="info"
            >
              {intl.formatMessage(messages.settinguptelegramDescription, {
                CreateBotLink: function CreateBotLink(msg) {
                  return (
                    <a
                      href="https://core.telegram.org/bots#6-botfather"
                      className="text-indigo-100 hover:text-white hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {msg}
                    </a>
                  );
                },
                GetIdBotLink: function GetIdBotLink(msg) {
                  return (
                    <a
                      href="https://telegram.me/get_id_bot"
                      className="text-indigo-100 hover:text-white hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {msg}
                    </a>
                  );
                },
                code: function code(msg) {
                  return <code className="bg-opacity-50">{msg}</code>;
                },
              })}
            </Alert>
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
                <label htmlFor="botUsername" className="text-label">
                  {intl.formatMessage(messages.botUsername)}
                  <span className="label-tip">
                    {intl.formatMessage(messages.botUsernameTip)}
                  </span>
                </label>
                <div className="form-input">
                  <div className="form-input-field">
                    <Field
                      id="botUsername"
                      name="botUsername"
                      type="text"
                      placeholder={intl.formatMessage(messages.botUsername)}
                    />
                  </div>
                  {errors.botUsername && touched.botUsername && (
                    <div className="error">{errors.botUsername}</div>
                  )}
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="botAPI" className="text-label">
                  {intl.formatMessage(messages.botAPI)}
                  <span className="label-required">*</span>
                </label>
                <div className="form-input">
                  <div className="form-input-field">
                    <Field
                      id="botAPI"
                      name="botAPI"
                      type="text"
                      placeholder={intl.formatMessage(messages.botAPI)}
                    />
                  </div>
                  {errors.botAPI && touched.botAPI && (
                    <div className="error">{errors.botAPI}</div>
                  )}
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="chatId" className="text-label">
                  {intl.formatMessage(messages.chatId)}
                  <span className="label-required">*</span>
                </label>
                <div className="form-input">
                  <div className="form-input-field">
                    <Field
                      id="chatId"
                      name="chatId"
                      type="text"
                      placeholder={intl.formatMessage(messages.chatId)}
                    />
                  </div>
                  {errors.chatId && touched.chatId && (
                    <div className="error">{errors.chatId}</div>
                  )}
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="sendSilently" className="checkbox-label">
                  <span>{intl.formatMessage(messages.sendSilently)}</span>
                  <span className="label-tip">
                    {intl.formatMessage(messages.sendSilentlyTip)}
                  </span>
                </label>
                <div className="form-input">
                  <Field
                    type="checkbox"
                    id="sendSilently"
                    name="sendSilently"
                  />
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
          </>
        );
      }}
    </Formik>
  );
};

export default NotificationsTelegram;
