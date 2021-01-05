import React from 'react';
import { Field, Form, Formik } from 'formik';
import useSWR from 'swr';
import LoadingSpinner from '../../../Common/LoadingSpinner';
import Button from '../../../Common/Button';
import { defineMessages, useIntl } from 'react-intl';
import axios from 'axios';
import * as Yup from 'yup';
import { useToasts } from 'react-toast-notifications';
import Alert from '../../../Common/Alert';
import NotificationTypeSelector from '../../../NotificationTypeSelector';

const messages = defineMessages({
  save: 'Save Changes',
  saving: 'Saving...',
  agentenabled: 'Agent Enabled',
  accessToken: 'Access Token',
  userToken: 'User Token',
  validationAccessTokenRequired: 'You must provide an access token.',
  validationUserTokenRequired: 'You must provide a user token.',
  pushoversettingssaved: 'Pushover notification settings saved!',
  pushoversettingsfailed: 'Pushover notification settings failed to save.',
  testsent: 'Test notification sent!',
  test: 'Test',
  settinguppushover: 'Setting up Pushover Notifications',
  settinguppushoverDescription:
    'To setup Pushover you need to <RegisterApplicationLink>register an application</RegisterApplicationLink> and get the access token.\
    When setting up the application you can use one of the icons in the <IconLink>public folder</IconLink> on github.\
    You also need the pushover user token which can be found on the start page when you log in.',
  notificationtypes: 'Notification Types',
});

const NotificationsPushover: React.FC = () => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const { data, error, revalidate } = useSWR(
    '/api/v1/settings/notifications/pushover'
  );

  const NotificationsPushoverSchema = Yup.object().shape({
    accessToken: Yup.string().required(
      intl.formatMessage(messages.validationAccessTokenRequired)
    ),
    userToken: Yup.string().required(
      intl.formatMessage(messages.validationUserTokenRequired)
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
        accessToken: data?.options.accessToken,
        userToken: data?.options.userToken,
      }}
      validationSchema={NotificationsPushoverSchema}
      onSubmit={async (values) => {
        try {
          await axios.post('/api/v1/settings/notifications/pushover', {
            enabled: values.enabled,
            types: values.types,
            options: {
              accessToken: values.accessToken,
              userToken: values.userToken,
            },
          });
          addToast(intl.formatMessage(messages.pushoversettingssaved), {
            appearance: 'success',
            autoDismiss: true,
          });
        } catch (e) {
          addToast(intl.formatMessage(messages.pushoversettingsfailed), {
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
          await axios.post('/api/v1/settings/notifications/pushover/test', {
            enabled: true,
            types: values.types,
            options: {
              accessToken: values.accessToken,
              userToken: values.userToken,
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
              title={intl.formatMessage(messages.settinguppushover)}
              type="info"
            >
              {intl.formatMessage(messages.settinguppushoverDescription, {
                RegisterApplicationLink: function RegisterApplicationLink(msg) {
                  return (
                    <a
                      href="https://pushover.net/apps/build"
                      className="text-indigo-100 hover:text-white hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {msg}
                    </a>
                  );
                },
                IconLink: function IconLink(msg) {
                  return (
                    <a
                      href="https://github.com/sct/overseerr/tree/develop/public"
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
            <Form>
              <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200">
                <label
                  htmlFor="enabled"
                  className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px"
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
              <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800">
                <label
                  htmlFor="accessToken"
                  className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px"
                >
                  {intl.formatMessage(messages.accessToken)}
                </label>
                <div className="mt-1 sm:mt-0 sm:col-span-2">
                  <div className="flex max-w-lg rounded-md shadow-sm">
                    <Field
                      id="accessToken"
                      name="accessToken"
                      type="text"
                      placeholder={intl.formatMessage(messages.accessToken)}
                      className="flex-1 block w-full min-w-0 transition duration-150 ease-in-out bg-gray-700 border border-gray-500 rounded-md form-input sm:text-sm sm:leading-5"
                    />
                  </div>
                  {errors.accessToken && touched.accessToken && (
                    <div className="mt-2 text-red-500">
                      {errors.accessToken}
                    </div>
                  )}
                </div>
                <label
                  htmlFor="userToken"
                  className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px"
                >
                  {intl.formatMessage(messages.userToken)}
                </label>
                <div className="mt-1 sm:mt-0 sm:col-span-2">
                  <div className="flex max-w-lg rounded-md shadow-sm">
                    <Field
                      id="userToken"
                      name="userToken"
                      type="text"
                      placeholder={intl.formatMessage(messages.userToken)}
                      className="flex-1 block w-full min-w-0 transition duration-150 ease-in-out bg-gray-700 border border-gray-500 rounded-md form-input sm:text-sm sm:leading-5"
                    />
                  </div>
                  {errors.userToken && touched.userToken && (
                    <div className="mt-2 text-red-500">{errors.userToken}</div>
                  )}
                </div>
              </div>
              <div className="mt-6">
                <div role="group" aria-labelledby="label-permissions">
                  <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-baseline">
                    <div>
                      <div
                        className="text-base font-medium leading-6 text-gray-400 sm:text-sm sm:leading-5"
                        id="label-types"
                      >
                        {intl.formatMessage(messages.notificationtypes)}
                      </div>
                    </div>
                    <div className="mt-4 sm:mt-0 sm:col-span-2">
                      <div className="max-w-lg">
                        <NotificationTypeSelector
                          currentTypes={values.types}
                          onUpdate={(newTypes) =>
                            setFieldValue('types', newTypes)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-5 mt-8 border-t border-gray-700">
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
                      {intl.formatMessage(messages.test)}
                    </Button>
                  </span>
                  <span className="inline-flex ml-3 rounded-md shadow-sm">
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

export default NotificationsPushover;
