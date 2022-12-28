import Button from '@app/components/Common/Button';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import useSettings from '@app/hooks/useSettings';
import { useUser } from '@app/hooks/useUser';
import { LoginIcon, SupportIcon } from '@heroicons/react/outline';
import {
  ArrowLeftOnRectangleIcon,
  LifebuoyIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { defineMessages, useIntl } from 'react-intl';
import * as Yup from 'yup';

const messages = defineMessages({
  email: 'Email Address',
  password: 'Password',
  validationemailrequired: 'You must provide a valid email address',
  validationpasswordrequired: 'You must provide a password',
  loginerror: 'Something went wrong while trying to sign in.',
  signingin: 'Signing In…',
  signin: 'Sign In',
  forgotpassword: 'Forgot Password?',
});

type LocalLoginProps = {
  onError: (errorMessage: string) => void;
};

const LocalLogin = ({ onError }: LocalLoginProps) => {
  const intl = useIntl();
  const router = useRouter();
  const { revalidate } = useUser();
  const settings = useSettings();

  const LoginSchema = Yup.object().shape({
    email: Yup.string()
      .email()
      .required(intl.formatMessage(messages.validationemailrequired)),
    password: Yup.string().required(
      intl.formatMessage(messages.validationpasswordrequired)
    ),
  });

  const passwordResetEnabled =
    settings.currentSettings.applicationUrl &&
    settings.currentSettings.emailEnabled;

  return (
    <Formik
      initialValues={{
        email: '',
        password: '',
      }}
      validationSchema={LoginSchema}
      onSubmit={async (values) => {
        try {
          const response = await axios.post('/api/v1/auth/local', {
            email: values.email,
            password: values.password,
          });

          if (response.data?.id) {
            const user = await revalidate();

            if (user) {
              router.push('/');
            }
          }
        } catch (e) {
          onError(intl.formatMessage(messages.loginerror));
        }
      }}
    >
      {({ errors, touched, isSubmitting, isValid }) => {
        return (
          <Form>
            <div>
              <label htmlFor="email" className="text-label">
                {intl.formatMessage(messages.email)}
              </label>
              <div className="mt-1 mb-2 sm:col-span-2 sm:mt-0">
                <div className="form-input-field">
                  <Field
                    id="email"
                    name="email"
                    type="text"
                    inputMode="email"
                    data-testid="email"
                  />
                </div>
                {errors.email &&
                  touched.email &&
                  typeof errors.email === 'string' && (
                    <div className="error">{errors.email}</div>
                  )}
              </div>
              <label htmlFor="password" className="text-label">
                {intl.formatMessage(messages.password)}
              </label>
              <div className="mt-1 mb-2 sm:col-span-2 sm:mt-0">
                <div className="form-input-field">
                  <SensitiveInput
                    as="field"
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    data-testid="password"
                    data-1pignore="false"
                    data-lpignore="false"
                    data-bwignore="false"
                  />
                      
                </div>
                {errors.password &&
                  touched.password &&
                  typeof errors.password === 'string' && (
                    <div className="error">{errors.password}</div>
                  )}
              </div>
            </div>
            <div className="mt-8 border-t border-gray-700 pt-5">
              <div className="flex flex-row-reverse justify-between">
                <span className="inline-flex rounded-md shadow-sm">
                  <Button
                    buttonType="primary"
                    type="submit"
                    disabled={isSubmitting || !isValid}
                    data-testid="local-signin-button"
                  >
                    <LoginIcon />
                    <span>
                      {isSubmitting
                        ? intl.formatMessage(messages.signingin)
                        : intl.formatMessage(messages.signin)}
                    </span>
                  </Button>
                </span>
                {passwordResetEnabled && (
                  <span className="inline-flex rounded-md shadow-sm">
                    <Link href="/resetpassword" passHref>
                      <Button as="a" buttonType="ghost">
                        <SupportIcon />
                        <span>
                          {intl.formatMessage(messages.forgotpassword)}
                        </span>
                      </Button>
                    </Link>
                  </span>
                )}
              </div>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
};

export default LocalLogin;
