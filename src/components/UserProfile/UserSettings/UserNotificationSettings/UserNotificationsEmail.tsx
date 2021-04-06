import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';
import * as Yup from 'yup';
import { UserSettingsNotificationsResponse } from '../../../../../server/interfaces/api/userSettingsInterfaces';
import {
  hasNotificationAgentEnabled,
  NotificationAgentType,
} from '../../../../../server/lib/notifications/agenttypes';
import { useUser } from '../../../../hooks/useUser';
import globalMessages from '../../../../i18n/globalMessages';
import Badge from '../../../Common/Badge';
import Button from '../../../Common/Button';
import LoadingSpinner from '../../../Common/LoadingSpinner';
import { OpenPgpLink } from '../../../Settings/Notifications/NotificationsEmail';

const messages = defineMessages({
  emailsettingssaved: 'Email notification settings saved successfully!',
  emailsettingsfailed: 'Email notification settings failed to save.',
  enableEmail: 'Enable Notifications',
  pgpPublicKey: 'PGP Public Key',
  pgpPublicKeyTip:
    'Encrypt email messages using <OpenPgpLink>OpenPGP</OpenPgpLink>',
  validationPgpPublicKey: 'You must provide a valid PGP public key',
});

const UserEmailSettings: React.FC = () => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const router = useRouter();
  const [notificationAgents, setNotificationAgents] = useState(0);
  const { user } = useUser({ id: Number(router.query.userId) });
  const { data, error, revalidate } = useSWR<UserSettingsNotificationsResponse>(
    user ? `/api/v1/user/${user?.id}/settings/notifications` : null
  );

  useEffect(() => {
    setNotificationAgents(
      data?.notificationAgents ?? NotificationAgentType.EMAIL
    );
  }, [data]);

  const UserNotificationsEmailSchema = Yup.object().shape({
    pgpKey: Yup.string()
      .nullable()
      .matches(
        /^-----BEGIN PGP PUBLIC KEY BLOCK-----.+-----END PGP PUBLIC KEY BLOCK-----$/,
        intl.formatMessage(messages.validationPgpPublicKey)
      ),
  });

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  return (
    <Formik
      initialValues={{
        enableEmail: hasNotificationAgentEnabled(
          NotificationAgentType.EMAIL,
          data?.notificationAgents ?? NotificationAgentType.EMAIL
        ),
        pgpKey: data?.pgpKey,
      }}
      validationSchema={UserNotificationsEmailSchema}
      enableReinitialize
      onSubmit={async (values) => {
        try {
          await axios.post(`/api/v1/user/${user?.id}/settings/notifications`, {
            notificationAgents,
            pgpKey: values.pgpKey,
            discordId: data?.discordId,
            telegramChatId: data?.telegramChatId,
            telegramSendSilently: data?.telegramSendSilently,
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
      {({ errors, touched, isSubmitting, isValid, values, setFieldValue }) => {
        return (
          <Form className="section">
            <div className="form-row">
              <label htmlFor="enableEmail" className="checkbox-label">
                {intl.formatMessage(messages.enableEmail)}
              </label>
              <div className="form-input">
                <Field
                  type="checkbox"
                  id="enableEmail"
                  name="enableEmail"
                  checked={hasNotificationAgentEnabled(
                    NotificationAgentType.EMAIL,
                    notificationAgents
                  )}
                  onChange={() => {
                    setNotificationAgents(
                      hasNotificationAgentEnabled(
                        NotificationAgentType.EMAIL,
                        notificationAgents
                      )
                        ? notificationAgents - NotificationAgentType.EMAIL
                        : notificationAgents + NotificationAgentType.EMAIL
                    );
                    setFieldValue('enableEmail', !values.enableEmail);
                  }}
                />
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="pgpKey" className="text-label">
                <span className="mr-2">
                  {intl.formatMessage(messages.pgpPublicKey)}
                </span>
                <Badge badgeType="danger">
                  {intl.formatMessage(globalMessages.advanced)}
                </Badge>
                <span className="label-tip">
                  {intl.formatMessage(messages.pgpPublicKeyTip, {
                    OpenPgpLink: OpenPgpLink,
                  })}
                </span>
              </label>
              <div className="form-input">
                <div className="form-input-field">
                  <Field
                    as="textarea"
                    id="pgpKey"
                    name="pgpKey"
                    rows="10"
                    className="font-mono text-xs"
                  />
                </div>
                {errors.pgpKey && touched.pgpKey && (
                  <div className="error">{errors.pgpKey}</div>
                )}
              </div>
            </div>
            <div className="actions">
              <div className="flex justify-end">
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
        );
      }}
    </Formik>
  );
};

export default UserEmailSettings;
