import Button from '@app/components/Common/Button';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import LoginWithPlex from '@app/components/Setup/LoginWithPlex';
import { useUser } from '@app/hooks/useUser';
import { ArrowLeftIcon, UserIcon } from '@heroicons/react/solid';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import * as Yup from 'yup';

const messages = defineMessages({
  welcometooverseerr: 'Welcome to Overseerr!',
  getstarted:
    "Let's get started! To begin, we will need to create your administrator account. You can either do this by logging in with your Plex account, or creating a local user.",
  validationEmail: 'You must provide a valid email address',
  validationpasswordminchars:
    'Password is too short; should be a minimum of 8 characters',
});

type StepOneProps = {
  onComplete: () => void;
};

const StepOne = ({ onComplete }: StepOneProps) => {
  const { revalidate } = useUser();
  const [showLocalCreateForm, setShowLocalCreateForm] = useState(false);
  const intl = useIntl();

  const CreateUserSchema = Yup.object().shape({
    email: Yup.string()
      .required(intl.formatMessage(messages.validationEmail))
      .email(intl.formatMessage(messages.validationEmail)),
    password: Yup.lazy((value) =>
      !value
        ? Yup.string()
        : Yup.string().min(
            8,
            intl.formatMessage(messages.validationpasswordminchars)
          )
    ),
  });

  return (
    <>
      <h1 className="text-overseerr text-4xl font-bold">
        {intl.formatMessage(messages.welcometooverseerr)}
      </h1>
      <p className="mt-4 mb-6">{intl.formatMessage(messages.getstarted)}</p>
      <div className="mx-auto max-w-xl">
        {showLocalCreateForm ? (
          <Formik
            initialValues={{
              email: '',
              password: '',
            }}
            onSubmit={async (values) => {
              try {
                await axios.post('/api/v1/auth/local', {
                  email: values.email,
                  password: values.password,
                });
                revalidate();
                onComplete();
              } catch (e) {
                console.log(e.message);
              }
            }}
            validationSchema={CreateUserSchema}
          >
            {({ isSubmitting, errors, touched, isValid }) => (
              <Form>
                <div>
                  <label htmlFor="email" className="text-label">
                    Email
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
                    Password
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
                    <Button
                      buttonType="primary"
                      type="submit"
                      disabled={isSubmitting || !isValid}
                      data-testid="local-signin-button"
                    >
                      <UserIcon />
                      <span>
                        {isSubmitting
                          ? 'Creating Account...'
                          : 'Create Account'}
                      </span>
                    </Button>
                    <Button onClick={() => setShowLocalCreateForm(false)}>
                      <ArrowLeftIcon />
                      <span>Go Back</span>
                    </Button>
                  </div>
                </div>
              </Form>
            )}
          </Formik>
        ) : (
          <div className="flex flex-col space-y-2">
            <LoginWithPlex onComplete={onComplete} />
            <Button
              buttonType="primary"
              onClick={() => setShowLocalCreateForm(true)}
            >
              <UserIcon />
              <span>Create Local Account</span>
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default StepOne;
