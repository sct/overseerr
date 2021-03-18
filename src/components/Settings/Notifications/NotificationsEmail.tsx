import React from 'react';
import { Field, Form, Formik } from 'formik';
import useSWR from 'swr';
import LoadingSpinner from '../../Common/LoadingSpinner';
import Button from '../../Common/Button';
import { defineMessages, useIntl } from 'react-intl';
import axios from 'axios';
import * as Yup from 'yup';
import { useToasts } from 'react-toast-notifications';
import NotificationTypeSelector from '../../NotificationTypeSelector';
import Alert from '../../Common/Alert';
import Badge from '../../Common/Badge';
import globalMessages from '../../../i18n/globalMessages';

const messages = defineMessages({
  save: 'Save Changes',
  saving: 'Saving…',
  validationSmtpHostRequired: 'You must provide an SMTP host',
  validationSmtpPortRequired: 'You must provide an SMTP port',
  agentenabled: 'Enable Agent',
  emailsender: 'Sender Address',
  smtpHost: 'SMTP Host',
  smtpPort: 'SMTP Port',
  enableSsl: 'Enable SSL',
  authUser: 'SMTP Username',
  authPass: 'SMTP Password',
  emailsettingssaved: 'Email notification settings saved successfully!',
  emailsettingsfailed: 'Email notification settings failed to save.',
  test: 'Test',
  testsent: 'Test notification sent!',
  allowselfsigned: 'Allow Self-Signed Certificates',
  ssldisabletip:
    'SSL should be disabled on standard TLS connections (port 587)',
  senderName: 'Sender Name',
  notificationtypes: 'Notification Types',
  validationEmail: 'You must provide a valid email address',
  emailNotificationTypesAlert: 'Email Notification Recipients',
  emailNotificationTypesAlertDescription:
    '<strong>Media Requested</strong>, <strong>Media Automatically Approved</strong>, and <strong>Media Failed</strong>\
    email notifications are sent to all users with the <strong>Manage Requests</strong> permission.',
  emailNotificationTypesAlertDescriptionPt2:
    '<strong>Media Approved</strong>, <strong>Media Declined</strong>, and <strong>Media Available</strong>\
    email notifications are sent to the user who submitted the request.',
  pgpPrivateKey: '<PgpLink>PGP</PgpLink> Private Key',
  pgpPrivateKeyTip:
    'Sign encrypted email messages (PGP password is also required)',
  pgpPassword: '<PgpLink>PGP</PgpLink> Password',
  pgpPasswordTip:
    'Sign encrypted email messages (PGP private key is also required)',
});

export function PgpLink(msg: string): JSX.Element {
  return (
    <a
      href="https://www.openpgp.org/"
      target="_blank"
      rel="noreferrer"
      className="text-gray-100 underline transition duration-300 hover:text-white"
    >
      {msg}
    </a>
  );
}

const NotificationsEmail: React.FC = () => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const { data, error, revalidate } = useSWR(
    '/api/v1/settings/notifications/email'
  );

  const NotificationsEmailSchema = Yup.object().shape({
    emailFrom: Yup.string()
      .required(intl.formatMessage(messages.validationEmail))
      .email(intl.formatMessage(messages.validationEmail)),
    smtpHost: Yup.string()
      .required(intl.formatMessage(messages.validationSmtpHostRequired))
      .matches(
        // eslint-disable-next-line
        /^(([a-z]|\d|_|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*)?([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])$/i,
        intl.formatMessage(messages.validationSmtpHostRequired)
      ),
    smtpPort: Yup.number().required(
      intl.formatMessage(messages.validationSmtpPortRequired)
    ),
  });

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  return (
    <Formik
      initialValues={{
        enabled: data.enabled,
        types: data.types,
        emailFrom: data.options.emailFrom,
        smtpHost: data.options.smtpHost,
        smtpPort: data.options.smtpPort,
        secure: data.options.secure,
        authUser: data.options.authUser,
        authPass: data.options.authPass,
        allowSelfSigned: data.options.allowSelfSigned,
        senderName: data.options.senderName,
        pgpPrivateKey: data.options.pgpPrivateKey,
        pgpPassword: data.options.pgpPassword,
      }}
      validationSchema={NotificationsEmailSchema}
      onSubmit={async (values) => {
        try {
          await axios.post('/api/v1/settings/notifications/email', {
            enabled: values.enabled,
            types: values.types,
            options: {
              emailFrom: values.emailFrom,
              smtpHost: values.smtpHost,
              smtpPort: Number(values.smtpPort),
              secure: values.secure,
              authUser: values.authUser,
              authPass: values.authPass,
              allowSelfSigned: values.allowSelfSigned,
              senderName: values.senderName,
              pgpPrivateKey: values.pgpPrivateKey,
              pgpPassword: values.pgpPassword,
            },
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
      {({ errors, touched, isSubmitting, values, isValid, setFieldValue }) => {
        const testSettings = async () => {
          await axios.post('/api/v1/settings/notifications/email/test', {
            enabled: true,
            types: values.types,
            options: {
              emailFrom: values.emailFrom,
              smtpHost: values.smtpHost,
              smtpPort: Number(values.smtpPort),
              secure: values.secure,
              authUser: values.authUser,
              authPass: values.authPass,
              senderName: values.senderName,
              pgpPrivateKey: values.pgpPrivateKey,
              pgpPassword: values.pgpPassword,
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
              title={intl.formatMessage(messages.emailNotificationTypesAlert)}
              type="info"
            >
              <p className="mb-2">
                {intl.formatMessage(
                  messages.emailNotificationTypesAlertDescription,
                  {
                    strong: function strong(msg) {
                      return (
                        <strong className="font-normal text-indigo-100">
                          {msg}
                        </strong>
                      );
                    },
                  }
                )}
              </p>
              <p>
                {intl.formatMessage(
                  messages.emailNotificationTypesAlertDescriptionPt2,
                  {
                    strong: function strong(msg) {
                      return (
                        <strong className="font-normal text-indigo-100">
                          {msg}
                        </strong>
                      );
                    },
                  }
                )}
              </p>
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
                <label htmlFor="emailFrom" className="text-label">
                  {intl.formatMessage(messages.emailsender)}
                </label>
                <div className="form-input">
                  <div className="form-input-field">
                    <Field
                      id="emailFrom"
                      name="emailFrom"
                      type="text"
                      placeholder="no-reply@example.com"
                    />
                  </div>
                  {errors.emailFrom && touched.emailFrom && (
                    <div className="error">{errors.emailFrom}</div>
                  )}
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="senderName" className="text-label">
                  {intl.formatMessage(messages.senderName)}
                </label>
                <div className="form-input">
                  <div className="form-input-field">
                    <Field
                      id="senderName"
                      name="senderName"
                      placeholder="Overseerr"
                      type="text"
                    />
                  </div>
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="smtpHost" className="text-label">
                  {intl.formatMessage(messages.smtpHost)}
                </label>
                <div className="form-input">
                  <div className="form-input-field">
                    <Field
                      id="smtpHost"
                      name="smtpHost"
                      type="text"
                      placeholder="localhost"
                    />
                  </div>
                  {errors.smtpHost && touched.smtpHost && (
                    <div className="error">{errors.smtpHost}</div>
                  )}
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="smtpPort" className="text-label">
                  {intl.formatMessage(messages.smtpPort)}
                </label>
                <div className="form-input">
                  <Field
                    id="smtpPort"
                    name="smtpPort"
                    type="text"
                    placeholder="465"
                    className="short"
                  />
                  {errors.smtpPort && touched.smtpPort && (
                    <div className="error">{errors.smtpPort}</div>
                  )}
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="secure" className="checkbox-label">
                  <span>{intl.formatMessage(messages.enableSsl)}</span>
                  <span className="label-tip">
                    {intl.formatMessage(messages.ssldisabletip)}
                  </span>
                </label>
                <div className="form-input">
                  <Field type="checkbox" id="secure" name="secure" />
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="allowSelfSigned" className="checkbox-label">
                  {intl.formatMessage(messages.allowselfsigned)}
                </label>
                <div className="form-input">
                  <Field
                    type="checkbox"
                    id="allowSelfSigned"
                    name="allowSelfSigned"
                  />
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="authUser" className="text-label">
                  {intl.formatMessage(messages.authUser)}
                </label>
                <div className="form-input">
                  <div className="form-input-field">
                    <Field id="authUser" name="authUser" type="text" />
                  </div>
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="authPass" className="text-label">
                  {intl.formatMessage(messages.authPass)}
                </label>
                <div className="form-input">
                  <div className="form-input-field">
                    <Field
                      id="authPass"
                      name="authPass"
                      type="password"
                      autoComplete="off"
                    />
                  </div>
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="pgpPrivateKey" className="text-label">
                  <span className="mr-2">
                    {intl.formatMessage(messages.pgpPrivateKey, {
                      PgpLink: PgpLink,
                    })}
                  </span>
                  <Badge badgeType="danger">
                    {intl.formatMessage(globalMessages.advanced)}
                  </Badge>
                  <span className="label-tip">
                    {intl.formatMessage(messages.pgpPrivateKeyTip)}
                  </span>
                </label>
                <div className="form-input">
                  <div className="form-input-field">
                    <Field
                      id="pgpPrivateKey"
                      name="pgpPrivateKey"
                      as="textarea"
                      rows="3"
                    />
                  </div>
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="pgpPassword" className="text-label">
                  <span className="mr-2">
                    {intl.formatMessage(messages.pgpPassword, {
                      PgpLink: PgpLink,
                    })}
                  </span>
                  <Badge badgeType="danger">
                    {intl.formatMessage(globalMessages.advanced)}
                  </Badge>
                  <span className="label-tip">
                    {intl.formatMessage(messages.pgpPasswordTip)}
                  </span>
                </label>
                <div className="form-input">
                  <div className="form-input-field">
                    <Field
                      id="pgpPassword"
                      name="pgpPassword"
                      type="password"
                      autoComplete="off"
                    />
                  </div>
                </div>
              </div>
              <div
                role="group"
                aria-labelledby="group-label"
                className="form-group"
              >
                <div className="form-row">
                  <span id="group-label" className="group-label">
                    {intl.formatMessage(messages.notificationtypes)}
                  </span>
                  <div className="form-input">
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

export default NotificationsEmail;
