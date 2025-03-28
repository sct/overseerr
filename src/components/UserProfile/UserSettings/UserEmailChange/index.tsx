import Alert from '@app/components/Common/Alert';
import Button from '@app/components/Common/Button';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import { Permission, useUser } from '@app/hooks/useUser';
import globalMessages from '@app/i18n/globalMessages';
import Error from '@app/pages/_error';
import { ArrowDownOnSquareIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import { useRouter } from 'next/router';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';
import * as Yup from 'yup';

const messages = defineMessages({
  email: 'Email',
  currentpassword: 'Current Password',
  newemail: 'New Email',
  confirmemail: 'Confirm Email',
  toastSettingsSuccess: 'Email changed successfully!',
  toastSettingsFailure: 'Something went wrong while changing the email.',
  toastSettingsFailureVerifyCurrent:
    'Something went wrong while changing the email. Was your current password entered correctly?',
  validationCurrentPassword: 'You must provide your current password',
  validationEmail: 'You must provide a valid email address',
  validationConfirmEmail: 'You must confirm the new email',
  validationConfirmEmailSame: 'Emails must match',
  noPasswordSet:
    'This user account currently does not have a password set. Configure a password for this account first before trying to change the email address.',
  noPasswordSetOwnAccount:
    'Your account currently does not have a password set. Configure a password first before trying to change the email.',
  nopermissionDescription:
    "You do not have permission to modify this user's email.",
});

const UserEmailChange = () => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const router = useRouter();
  const { user: currentUser, revalidate: revalidateUser } = useUser();
  const { user, hasPermission } = useUser({ id: Number(router.query.userId) });
  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR<{ hasPassword: boolean }>(
    user ? `/api/v1/user/${user?.id}/settings/password` : null
  );

  const EmailChangeSchema = Yup.object().shape({
    currentPassword: Yup.lazy(() =>
      currentUser?.id === user?.id
        ? Yup.string().required(
            intl.formatMessage(messages.validationCurrentPassword)
          )
        : Yup.mixed().optional()
    ),
    newEmail: Yup.string()
      .required(intl.formatMessage(messages.validationEmail))
      .email(intl.formatMessage(messages.validationEmail)),
    confirmEmail: Yup.string()
      .required(intl.formatMessage(messages.validationConfirmEmail))
      .oneOf(
        [Yup.ref('newEmail'), null],
        intl.formatMessage(messages.validationConfirmEmailSame)
      ),
  });

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <Error statusCode={500} />;
  }

  if (
    currentUser?.id !== user?.id &&
    hasPermission(Permission.ADMIN) &&
    currentUser?.id !== 1
  ) {
    return (
      <>
        <div className="mb-6">
          <h3 className="heading">{intl.formatMessage(messages.email)}</h3>
        </div>
        <Alert
          title={intl.formatMessage(messages.nopermissionDescription)}
          type="error"
        />
      </>
    );
  }

  if (!data.hasPassword) {
    return (
      <Alert
        type="warning"
        title={intl.formatMessage(
          user?.id === currentUser?.id
            ? messages.noPasswordSetOwnAccount
            : messages.noPasswordSet
        )}
      />
    );
  }

  return (
    <>
      <PageTitle
        title={[
          intl.formatMessage(messages.email),
          intl.formatMessage(globalMessages.usersettings),
          user?.displayName,
        ]}
      />
      <div className="mb-6">
        <h3 className="heading">{intl.formatMessage(messages.email)}</h3>
      </div>
      <Formik
        initialValues={{
          currentPassword: '',
          newEmail: '',
          confirmEmail: '',
        }}
        validationSchema={EmailChangeSchema}
        enableReinitialize
        onSubmit={async (values, { resetForm }) => {
          try {
            await axios.post(`/api/v1/user/${user?.id}/settings/email`, {
              currentPassword: values.currentPassword,
              newEmail: values.newEmail,
              confirmEmail: values.confirmEmail,
            });

            addToast(intl.formatMessage(messages.toastSettingsSuccess), {
              autoDismiss: true,
              appearance: 'success',
            });
            revalidateUser();
          } catch (e) {
            addToast(
              intl.formatMessage(
                data.hasPassword && user?.id === currentUser?.id
                  ? messages.toastSettingsFailureVerifyCurrent
                  : messages.toastSettingsFailure
              ),
              {
                autoDismiss: true,
                appearance: 'error',
              }
            );
          } finally {
            revalidate();
            resetForm();
          }
        }}
      >
        {({ errors, touched, isSubmitting, isValid }) => {
          return (
            <Form className="section">
              {!data.hasPassword && (
                <Alert
                  type="warning"
                  title={intl.formatMessage(
                    user?.id === currentUser?.id
                      ? messages.noPasswordSetOwnAccount
                      : messages.noPasswordSet
                  )}
                />
              )}
              {data.hasPassword && user?.id === currentUser?.id && (
                <div className="form-row pb-6">
                  <label htmlFor="currentPassword" className="text-label">
                    {intl.formatMessage(messages.currentpassword)}
                  </label>
                  <div className="form-input-area">
                    <div className="form-input-field">
                      <SensitiveInput
                        as="field"
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        autoComplete="current-password"
                      />
                    </div>
                    {errors.currentPassword &&
                      touched.currentPassword &&
                      typeof errors.currentPassword === 'string' && (
                        <div className="error">{errors.currentPassword}</div>
                      )}
                  </div>
                </div>
              )}
              <div className="form-row">
                <label htmlFor="newEmail" className="text-label">
                  {intl.formatMessage(messages.newemail)}
                </label>
                <div className="form-input-area">
                  <div className="form-input-field">
                    <Field id="newEmail" name="newEmail" type="text" />
                  </div>
                  {errors.newEmail &&
                    touched.newEmail &&
                    typeof errors.newEmail === 'string' && (
                      <div className="error">{errors.newEmail}</div>
                    )}
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="confirmEmail" className="text-label">
                  {intl.formatMessage(messages.confirmemail)}
                </label>
                <div className="form-input-area">
                  <div className="form-input-field">
                    <Field id="confirmEmail" name="confirmEmail" type="text" />
                  </div>
                  {errors.confirmEmail &&
                    touched.confirmEmail &&
                    typeof errors.confirmEmail === 'string' && (
                      <div className="error">{errors.confirmEmail}</div>
                    )}
                </div>
              </div>
              <div className="actions">
                <div className="flex justify-end">
                  <span className="ml-3 inline-flex rounded-md shadow-sm">
                    <Button
                      buttonType="primary"
                      type="submit"
                      disabled={isSubmitting || !isValid}
                    >
                      <ArrowDownOnSquareIcon />
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
    </>
  );
};

export default UserEmailChange;
