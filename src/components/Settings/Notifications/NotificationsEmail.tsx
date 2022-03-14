import { BeakerIcon, SaveIcon } from '@heroicons/react/outline';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import React, { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR, { mutate } from 'swr';
import * as Yup from 'yup';
import globalMessages from '../../../i18n/globalMessages';
import Badge from '../../Common/Badge';
import Button from '../../Common/Button';
import LoadingSpinner from '../../Common/LoadingSpinner';
import SensitiveInput from '../../Common/SensitiveInput';

const messages = defineMessages({
  validationSmtpHostRequired: 'You must provide a valid hostname or IP address',
  validationSmtpPortRequired: 'You must provide a valid port number',
  agentenabled: 'Enable Agent',
  emailsender: 'Sender Address',
  smtpHost: 'SMTP Host',
  smtpPort: 'SMTP Port',
  encryption: 'Encryption Method',
  encryptionTip:
    'In most cases, Implicit TLS uses port 465 and STARTTLS uses port 587',
  encryptionNone: 'None',
  encryptionDefault: 'Use STARTTLS if available',
  encryptionOpportunisticTls: 'Always use STARTTLS',
  encryptionImplicitTls: 'Use Implicit TLS',
  authUser: 'SMTP Username',
  authPass: 'SMTP Password',
  emailsettingssaved: 'Email notification settings saved successfully!',
  emailsettingsfailed: 'Email notification settings failed to save.',
  toastEmailTestSending: 'Sending email test notification…',
  toastEmailTestSuccess: 'Email test notification sent!',
  toastEmailTestFailed: 'Email test notification failed to send.',
  allowselfsigned: 'Allow Self-Signed Certificates',
  senderName: 'Sender Name',
  validationEmail: 'You must provide a valid email address',
  pgpPrivateKey: 'PGP Private Key',
  pgpPrivateKeyTip:
    'Sign encrypted email messages using <OpenPgpLink>OpenPGP</OpenPgpLink>',
  validationPgpPrivateKey: 'You must provide a valid PGP private key',
  pgpPassword: 'PGP Password',
  pgpPasswordTip:
    'Sign encrypted email messages using <OpenPgpLink>OpenPGP</OpenPgpLink>',
  validationPgpPassword: 'You must provide a PGP password',
});

export function OpenPgpLink(msg: string): JSX.Element {
  return (
    <a href="https://www.openpgp.org/" target="_blank" rel="noreferrer">
      {msg}
    </a>
  );
}

const NotificationsEmail: React.FC = () => {
  const intl = useIntl();
  const { addToast, removeToast } = useToasts();
  const [isTesting, setIsTesting] = useState(false);
  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR('/api/v1/settings/notifications/email');

  const NotificationsEmailSchema = Yup.object().shape(
    {
      emailFrom: Yup.string()
        .when('enabled', {
          is: true,
          then: Yup.string()
            .nullable()
            .required(intl.formatMessage(messages.validationEmail)),
          otherwise: Yup.string().nullable(),
        })
        .email(intl.formatMessage(messages.validationEmail)),
      smtpHost: Yup.string()
        .when('enabled', {
          is: true,
          then: Yup.string()
            .nullable()
            .required(intl.formatMessage(messages.validationSmtpHostRequired)),
          otherwise: Yup.string().nullable(),
        })
        .matches(
          /^(((([a-z]|\d|_|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*)?([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])):((([a-z]|\d|_|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*)?([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))@)?(([a-z]|\d|_|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*)?([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])$/i,
          intl.formatMessage(messages.validationSmtpHostRequired)
        ),
      smtpPort: Yup.number().when('enabled', {
        is: true,
        then: Yup.number()
          .nullable()
          .required(intl.formatMessage(messages.validationSmtpPortRequired)),
        otherwise: Yup.number().nullable(),
      }),
      pgpPrivateKey: Yup.string()
        .when('pgpPassword', {
          is: (value: unknown) => !!value,
          then: Yup.string()
            .nullable()
            .required(intl.formatMessage(messages.validationPgpPrivateKey)),
          otherwise: Yup.string().nullable(),
        })
        .matches(
          /-----BEGIN PGP PRIVATE KEY BLOCK-----.+-----END PGP PRIVATE KEY BLOCK-----/s,
          intl.formatMessage(messages.validationPgpPrivateKey)
        ),
      pgpPassword: Yup.string().when('pgpPrivateKey', {
        is: (value: unknown) => !!value,
        then: Yup.string()
          .nullable()
          .required(intl.formatMessage(messages.validationPgpPassword)),
        otherwise: Yup.string().nullable(),
      }),
    },
    [['pgpPrivateKey', 'pgpPassword']]
  );

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  return (
    <Formik
      initialValues={{
        enabled: data.enabled,
        emailFrom: data.options.emailFrom,
        smtpHost: data.options.smtpHost,
        smtpPort: data.options.smtpPort ?? 587,
        encryption: data.options.secure
          ? 'implicit'
          : data.options.requireTls
          ? 'opportunistic'
          : data.options.ignoreTls
          ? 'none'
          : 'default',
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
            options: {
              emailFrom: values.emailFrom,
              smtpHost: values.smtpHost,
              smtpPort: Number(values.smtpPort),
              secure: values.encryption === 'implicit',
              ignoreTls: values.encryption === 'none',
              requireTls: values.encryption === 'opportunistic',
              authUser: values.authUser,
              authPass: values.authPass,
              allowSelfSigned: values.allowSelfSigned,
              senderName: values.senderName,
              pgpPrivateKey: values.pgpPrivateKey,
              pgpPassword: values.pgpPassword,
            },
          });
          mutate('/api/v1/settings/public');

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
      {({ errors, touched, isSubmitting, values, isValid }) => {
        const testSettings = async () => {
          setIsTesting(true);
          let toastId: string | undefined;
          try {
            addToast(
              intl.formatMessage(messages.toastEmailTestSending),
              {
                autoDismiss: false,
                appearance: 'info',
              },
              (id) => {
                toastId = id;
              }
            );
            await axios.post('/api/v1/settings/notifications/email/test', {
              enabled: true,
              options: {
                emailFrom: values.emailFrom,
                smtpHost: values.smtpHost,
                smtpPort: Number(values.smtpPort),
                secure: values.encryption === 'implicit',
                ignoreTls: values.encryption === 'none',
                requireTls: values.encryption === 'opportunistic',
                authUser: values.authUser,
                authPass: values.authPass,
                senderName: values.senderName,
                pgpPrivateKey: values.pgpPrivateKey,
                pgpPassword: values.pgpPassword,
              },
            });

            if (toastId) {
              removeToast(toastId);
            }
            addToast(intl.formatMessage(messages.toastEmailTestSuccess), {
              autoDismiss: true,
              appearance: 'success',
            });
          } catch (e) {
            if (toastId) {
              removeToast(toastId);
            }
            addToast(intl.formatMessage(messages.toastEmailTestFailed), {
              autoDismiss: true,
              appearance: 'error',
            });
          } finally {
            setIsTesting(false);
          }
        };

        return (
          <Form className="section">
            <div className="form-row">
              <label htmlFor="enabled" className="checkbox-label">
                {intl.formatMessage(messages.agentenabled)}
                <span className="label-required">*</span>
              </label>
              <div className="form-input-area">
                <Field type="checkbox" id="enabled" name="enabled" />
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="senderName" className="text-label">
                {intl.formatMessage(messages.senderName)}
              </label>
              <div className="form-input-area">
                <div className="form-input-field">
                  <Field id="senderName" name="senderName" type="text" />
                </div>
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="emailFrom" className="text-label">
                {intl.formatMessage(messages.emailsender)}
                <span className="label-required">*</span>
              </label>
              <div className="form-input-area">
                <div className="form-input-field">
                  <Field
                    id="emailFrom"
                    name="emailFrom"
                    type="text"
                    inputMode="email"
                  />
                </div>
                {errors.emailFrom && touched.emailFrom && (
                  <div className="error">{errors.emailFrom}</div>
                )}
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="smtpHost" className="text-label">
                {intl.formatMessage(messages.smtpHost)}
                <span className="label-required">*</span>
              </label>
              <div className="form-input-area">
                <div className="form-input-field">
                  <Field
                    id="smtpHost"
                    name="smtpHost"
                    type="text"
                    inputMode="url"
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
                <span className="label-required">*</span>
              </label>
              <div className="form-input-area">
                <Field
                  id="smtpPort"
                  name="smtpPort"
                  type="text"
                  inputMode="numeric"
                  className="short"
                />
                {errors.smtpPort && touched.smtpPort && (
                  <div className="error">{errors.smtpPort}</div>
                )}
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="encryption" className="text-label">
                {intl.formatMessage(messages.encryption)}
                <span className="label-required">*</span>
                <span className="label-tip">
                  {intl.formatMessage(messages.encryptionTip)}
                </span>
              </label>
              <div className="form-input-area">
                <div className="form-input-field">
                  <Field as="select" id="encryption" name="encryption">
                    <option value="none">
                      {intl.formatMessage(messages.encryptionNone)}
                    </option>
                    <option value="default">
                      {intl.formatMessage(messages.encryptionDefault)}
                    </option>
                    <option value="opportunistic">
                      {intl.formatMessage(messages.encryptionOpportunisticTls)}
                    </option>
                    <option value="implicit">
                      {intl.formatMessage(messages.encryptionImplicitTls)}
                    </option>
                  </Field>
                </div>
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="allowSelfSigned" className="checkbox-label">
                {intl.formatMessage(messages.allowselfsigned)}
              </label>
              <div className="form-input-area">
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
              <div className="form-input-area">
                <div className="form-input-field">
                  <Field id="authUser" name="authUser" type="text" />
                </div>
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="authPass" className="text-label">
                {intl.formatMessage(messages.authPass)}
              </label>
              <div className="form-input-area">
                <div className="form-input-field">
                  <SensitiveInput
                    as="field"
                    id="authPass"
                    name="authPass"
                    autoComplete="one-time-code"
                  />
                </div>
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="pgpPrivateKey" className="text-label">
                <span className="mr-2">
                  {intl.formatMessage(messages.pgpPrivateKey)}
                </span>
                <Badge badgeType="danger">
                  {intl.formatMessage(globalMessages.advanced)}
                </Badge>
                <span className="label-tip">
                  {intl.formatMessage(messages.pgpPrivateKeyTip, {
                    OpenPgpLink: OpenPgpLink,
                  })}
                </span>
              </label>
              <div className="form-input-area">
                <div className="form-input-field">
                  <SensitiveInput
                    as="field"
                    id="pgpPrivateKey"
                    name="pgpPrivateKey"
                    type="textarea"
                    rows="10"
                    className="font-mono text-xs"
                  />
                </div>
                {errors.pgpPrivateKey && touched.pgpPrivateKey && (
                  <div className="error">{errors.pgpPrivateKey}</div>
                )}
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="pgpPassword" className="text-label">
                <span className="mr-2">
                  {intl.formatMessage(messages.pgpPassword)}
                </span>
                <Badge badgeType="danger">
                  {intl.formatMessage(globalMessages.advanced)}
                </Badge>
                <span className="label-tip">
                  {intl.formatMessage(messages.pgpPasswordTip, {
                    OpenPgpLink: OpenPgpLink,
                  })}
                </span>
              </label>
              <div className="form-input-area">
                <div className="form-input-field">
                  <SensitiveInput
                    as="field"
                    id="pgpPassword"
                    name="pgpPassword"
                    autoComplete="one-time-code"
                  />
                </div>
                {errors.pgpPassword && touched.pgpPassword && (
                  <div className="error">{errors.pgpPassword}</div>
                )}
              </div>
            </div>
            <div className="actions">
              <div className="flex justify-end">
                <span className="ml-3 inline-flex rounded-md shadow-sm">
                  <Button
                    buttonType="warning"
                    disabled={isSubmitting || !isValid || isTesting}
                    onClick={(e) => {
                      e.preventDefault();
                      testSettings();
                    }}
                  >
                    <BeakerIcon />
                    <span>
                      {isTesting
                        ? intl.formatMessage(globalMessages.testing)
                        : intl.formatMessage(globalMessages.test)}
                    </span>
                  </Button>
                </span>
                <span className="ml-3 inline-flex rounded-md shadow-sm">
                  <Button
                    buttonType="primary"
                    type="submit"
                    disabled={isSubmitting || !isValid || isTesting}
                  >
                    <SaveIcon />
                    <span>
                      {isSubmitting
                        ? intl.formatMessage(globalMessages.saving)
                        : intl.formatMessage(globalMessages.save)}
                    </span>
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

export default NotificationsEmail;
