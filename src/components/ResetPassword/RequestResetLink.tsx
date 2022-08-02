import { ArrowLeftIcon, MailIcon } from '@heroicons/react/solid';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import Link from 'next/link';
import React, { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import * as Yup from 'yup';
import Button from '../Common/Button';
import ImageFader from '../Common/ImageFader';
import PageTitle from '../Common/PageTitle';
import LanguagePicker from '../Layout/LanguagePicker';

const messages = defineMessages({
  passwordreset: 'Password Reset',
  resetpassword: 'Reset your password',
  emailresetlink: 'Email Recovery Link',
  email: 'Email Address',
  validationemailrequired: 'You must provide a valid email address',
  gobacklogin: 'Return to Sign-In Page',
  requestresetlinksuccessmessage:
    'A password reset link will be sent to the provided email address if it is associated with a valid user.',
});

const ResetPassword: React.FC = () => {
  const intl = useIntl();
  const [hasSubmitted, setSubmitted] = useState(false);

  const ResetSchema = Yup.object().shape({
    email: Yup.string()
      .email(intl.formatMessage(messages.validationemailrequired))
      .required(intl.formatMessage(messages.validationemailrequired)),
  });

  return (
    <div className="relative flex min-h-screen flex-col bg-gray-900 py-14">
      <PageTitle title={intl.formatMessage(messages.passwordreset)} />
      <ImageFader
        forceOptimize
        backgroundImages={[
          '/images/rotate1.jpg',
          '/images/rotate2.jpg',
          '/images/rotate3.jpg',
          '/images/rotate4.jpg',
          '/images/rotate5.jpg',
          '/images/rotate6.jpg',
        ]}
      />
      <div className="absolute top-4 right-4 z-50">
        <LanguagePicker />
      </div>
      <div className="relative z-40 mt-10 flex flex-col items-center px-4 sm:mx-auto sm:w-full sm:max-w-md">
        <img src="/logo_stacked.svg" className="mb-10 max-w-full" alt="Logo" />
        <h2 className="mt-2 text-center text-3xl font-extrabold leading-9 text-gray-100">
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
                <p className="text-md text-gray-300">
                  {intl.formatMessage(messages.requestresetlinksuccessmessage)}
                </p>
                <span className="mt-4 flex justify-center rounded-md shadow-sm">
                  <Link href="/login" passHref>
                    <Button as="a" buttonType="ghost">
                      <ArrowLeftIcon />
                      <span>{intl.formatMessage(messages.gobacklogin)}</span>
                    </Button>
                  </Link>
                </span>
              </>
            ) : (
              <Formik
                initialValues={{
                  email: '',
                }}
                validationSchema={ResetSchema}
                onSubmit={async (values) => {
                  const response = await axios.post(
                    `/api/v1/auth/reset-password`,
                    {
                      email: values.email,
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
                      <div>
                        <label
                          htmlFor="email"
                          className="my-1 block text-sm font-medium leading-5 text-gray-400 sm:mt-px"
                        >
                          {intl.formatMessage(messages.email)}
                        </label>
                        <div className="mt-1 mb-2 sm:col-span-2 sm:mt-0">
                          <div className="form-input-field">
                            <Field
                              id="email"
                              name="email"
                              type="text"
                              inputMode="email"
                              className="form-input-area block w-full min-w-0 flex-1 rounded-md border border-gray-500 bg-gray-700 text-white transition duration-150 ease-in-out sm:text-sm sm:leading-5"
                            />
                          </div>
                          {errors.email && touched.email && (
                            <div className="error">{errors.email}</div>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 border-t border-gray-700 pt-5">
                        <div className="flex justify-end">
                          <span className="inline-flex rounded-md shadow-sm">
                            <Button
                              buttonType="primary"
                              type="submit"
                              disabled={isSubmitting || !isValid}
                            >
                              <MailIcon />
                              <span>
                                {intl.formatMessage(messages.emailresetlink)}
                              </span>
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
