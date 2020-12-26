import React from 'react';
import { Field, Form, Formik } from 'formik';
import useSWR from 'swr';
import LoadingSpinner from '../../Common/LoadingSpinner';
import Button from '../../Common/Button';
import { defineMessages, useIntl } from 'react-intl';
import axios from 'axios';
import * as Yup from 'yup';
import { useToasts } from 'react-toast-notifications';
import Alert from '../../Common/Alert';

const messages = defineMessages({
  save: 'Save Changes',
  saving: 'Saving...',
  agentenabled: 'Agent Enabled',
  botAPI: 'Bot API',
  chatId: 'Chat Id',
  validationBotAPIRequired: 'You must provide a Bot API key.',
  validationChatIdRequired: 'You must provide a Chat id.',
  telegramsettingssaved: 'Telegram notification settings saved!',
  telegramsettingsfailed: 'Telegram notification settings failed to save.',
  testsent: 'Test notification sent!',
  test: 'Test',
  settinguptelegram: 'Setting up Telegram Notifications',
  settinguptelegramDescription:
    'To setup Telegram you need to <CreateBotLink>create a bot</CreateBotLink> and get the bot API key.\
    Additionally, you need the chat id for the chat you want the bot to send notifications to.\
    You can do this by adding <GetIdBotLink>@get_id_bot</GetIdBotLink> to the chat or group chat.',
});

const NotificationsTelegram: React.FC = () => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const { data, error, revalidate } = useSWR(
    '/api/v1/settings/notifications/telegram'
  );

  const NotificationsTelegramSchema = Yup.object().shape({
    botAPI: Yup.string().required(
      intl.formatMessage(messages.validationBotAPIRequired)
    ),
    chatId: Yup.string().required(
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
        botAPI: data?.options.botAPI,
        chatId: data?.options.chatId,
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
      {({ errors, touched, isSubmitting, values, isValid }) => {
        const testSettings = async () => {
          await axios.post('/api/v1/settings/notifications/telegram/test', {
            enabled: true,
            types: values.types,
            options: {
              botAPI: values.botAPI,
              chatId: values.chatId,
            },
          });

          addToast(intl.formatMessage(messages.testsent), {
            appearance: 'info',
            autoDismiss: true,
          });
        };

        return (
          <>
            <p className="mb-">
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
                })}
              </Alert>
            </p>
            <Form>
              <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
                <label
                  htmlFor="enabled"
                  className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px sm:pt-2"
                >
                  {intl.formatMessage(messages.agentenabled)}
                </label>
                <div className="mt-1 sm:mt-0 sm:col-span-2">
                  <Field
                    type="checkbox"
                    id="enabled"
                    name="enabled"
                    className="w-6 h-6 text-indigo-600 transition duration-150 ease-in-out rounded-md form-checkbox"
                  />
                </div>
              </div>
              <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800 sm:pt-5">
                <label
                  htmlFor="botAPI"
                  className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px sm:pt-2"
                >
                  {intl.formatMessage(messages.botAPI)}
                </label>
                <div className="mt-1 sm:mt-0 sm:col-span-2">
                  <div className="max-w-lg flex rounded-md shadow-sm">
                    <Field
                      id="botAPI"
                      name="botAPI"
                      type="text"
                      placeholder={intl.formatMessage(messages.botAPI)}
                      className="flex-1 form-input block w-full min-w-0 rounded-md transition duration-150 ease-in-out sm:text-sm sm:leading-5 bg-gray-700 border border-gray-500"
                    />
                  </div>
                  {errors.botAPI && touched.botAPI && (
                    <div className="text-red-500 mt-2">{errors.botAPI}</div>
                  )}
                </div>
                <label
                  htmlFor="chatId"
                  className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px sm:pt-2"
                >
                  {intl.formatMessage(messages.chatId)}
                </label>
                <div className="mt-1 sm:mt-0 sm:col-span-2">
                  <div className="max-w-lg flex rounded-md shadow-sm">
                    <Field
                      id="chatId"
                      name="chatId"
                      type="text"
                      placeholder={intl.formatMessage(messages.chatId)}
                      className="flex-1 form-input block w-full min-w-0 rounded-md transition duration-150 ease-in-out sm:text-sm sm:leading-5 bg-gray-700 border border-gray-500"
                    />
                  </div>
                  {errors.chatId && touched.chatId && (
                    <div className="text-red-500 mt-2">{errors.chatId}</div>
                  )}
                </div>
              </div>
              <div className="mt-8 border-t border-gray-700 pt-5">
                <div className="flex justify-end">
                  <span className="ml-3 inline-flex rounded-md shadow-sm">
                    <Button
                      buttonType="warning"
                      disabled={isSubmitting || !isValid}
                      onClick={(e) => {
                        e.preventDefault();

                        testSettings();
                      }}
                    >
                      {intl.formatMessage(messages.test)}
                    </Button>
                  </span>
                  <span className="ml-3 inline-flex rounded-md shadow-sm">
                    <Button
                      buttonType="primary"
                      type="submit"
                      disabled={isSubmitting || !isValid}
                    >
                      {isSubmitting
                        ? intl.formatMessage(messages.saving)
                        : intl.formatMessage(messages.save)}
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
