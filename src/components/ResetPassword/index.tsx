import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import * as Yup from 'yup';
import Button from '../Common/Button';
import ImageFader from '../Common/ImageFader';
import LanguagePicker from '../Layout/LanguagePicker';

const messages = defineMessages({
  passwordreset: 'Password Reset',
  resetpassword: 'Reset your password',
  password: 'Password',
  confirmpassword: 'Confirm Password',
  validationpasswordrequired: 'You must provide a password',
  validationpasswordmatch: 'Passwords must match',
  validationpasswordminchars:
    'Password is too short; should be a minimum of 8 characters',
  gobacklogin: 'Return to Sign-In Page',
  resetpasswordsuccessmessage: 'Password reset successfully!',
});

const ResetPassword: React.FC = () => {
  const intl = useIntl();
  const router = useRouter();
  const [hasSubmitted, setSubmitted] = useState(false);

  const guid = router.query.guid;

  const ResetSchema = Yup.object().shape({
    password: Yup.string()
      .required(intl.formatMessage(messages.validationpasswordrequired))
      .min(8, intl.formatMessage(messages.validationpasswordminchars)),
    confirmPassword: Yup.string()
      .required(intl.formatMessage(messages.validationpasswordmatch))
      .test(
        'passwords-match',
        intl.formatMessage(messages.validationpasswordmatch),
        function (value) {
          return this.parent.password === value;
        }
      ),
  });

  return (
    <div className="relative flex flex-col min-h-screen bg-gray-900 py-14">
      <ImageFader
        backgroundImages={[
          '/images/rotate1.jpg',
          '/images/rotate2.jpg',
          '/images/rotate3.jpg',
          '/images/rotate4.jpg',
          '/images/rotate5.jpg',
          '/images/rotate6.jpg',
        ]}
      />
      <div className="absolute z-50 top-4 right-4">
        <LanguagePicker />
      </div>
      <div className="relative z-40 px-4 sm:mx-auto sm:w-full sm:max-w-md">
        <img src="/logo.png" className="max-w-full" alt="Logo" />
        <h2 className="mt-2 text-3xl font-extrabold leading-9 text-center text-gray-100">
          {intl.formatMessage(messages.resetpassword)}
        </h2>
      </div>
      <div className="relative z-50 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div
          className="bg-gray-800 bg-opacity-50 shadow sm:rounded-lg"
          style={{ backdropFilter: 'blur(5px)' }}
        >
          <div className="px-10 py-8">
            {hasSubmitted ? (
              <>
                <p className="text-gray-300 text-md">
                  {intl.formatMessage(messages.resetpasswordsuccessmessage)}
                </p>
                <span className="flex justify-center mt-4 rounded-md shadow-sm">
                  <Link href="/login" passHref>
                    <Button as="a" buttonType="ghost">
                      {intl.formatMessage(messages.gobacklogin)}
                    </Button>
                  </Link>
                </span>
              </>
            ) : (
              <Formik
                initialValues={{
                  confirmPassword: '',
                  password: '',
                }}
                validationSchema={ResetSchema}
                onSubmit={async (values) => {
                  const response = await axios.post(
                    `/api/v1/auth/reset-password/${guid}`,
                    {
                      password: values.password,
                    }
                  );

                  if (response.status === 200) {
                    setSubmitted(true);
                  }
                }}
              >
                {({ errors, touched, isSubmitting, isValid }) => {
                  return (
                    <Form>
                      <div className="sm:border-t sm:border-gray-800">
                        <label
                          htmlFor="password"
                          className="block my-1 text-sm font-medium leading-5 text-gray-400 sm:mt-px"
                        >
                          {intl.formatMessage(messages.password)}
                        </label>
                        <div className="mt-1 mb-2 sm:mt-0 sm:col-span-2">
                          <div className="form-input-field">
                            <Field
                              id="password"
                              name="password"
                              type="password"
                              autoComplete="new-password"
                              className="flex-1 block w-full min-w-0 text-white transition duration-150 ease-in-out bg-gray-700 border border-gray-500 rounded-md form-input sm:text-sm sm:leading-5"
                            />
                          </div>
                          {errors.password && touched.password && (
                            <div className="error">{errors.password}</div>
                          )}
                        </div>
                        <label
                          htmlFor="confirmPassword"
                          className="block my-1 text-sm font-medium leading-5 text-gray-400 sm:mt-px"
                        >
                          {intl.formatMessage(messages.confirmpassword)}
                        </label>
                        <div className="mt-1 mb-2 sm:mt-0 sm:col-span-2">
                          <div className="form-input-field">
                            <Field
                              id="confirmPassword"
                              name="confirmPassword"
                              type="password"
                              autoComplete="new-password"
                              className="flex-1 block w-full min-w-0 text-white transition duration-150 ease-in-out bg-gray-700 border border-gray-500 rounded-md form-input sm:text-sm sm:leading-5"
                            />
                          </div>
                          {errors.confirmPassword &&
                            touched.confirmPassword && (
                              <div className="error">
                                {errors.confirmPassword}
                              </div>
                            )}
                        </div>
                      </div>
                      <div className="pt-5 mt-4 border-t border-gray-700">
                        <div className="flex justify-end">
                          <span className="inline-flex rounded-md shadow-sm">
                            <Button
                              buttonType="primary"
                              type="submit"
                              disabled={isSubmitting || !isValid}
                            >
                              {intl.formatMessage(messages.resetpassword)}
                            </Button>
                          </span>
                        </div>
                      </div>
                    </Form>
                  );
                }}
              </Formik>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
