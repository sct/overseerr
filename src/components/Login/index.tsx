import React, { useEffect, useState } from 'react';
import PlexLoginButton from '../PlexLoginButton';
import { useUser } from '../../hooks/useUser';
import axios from 'axios';
import { useRouter } from 'next/dist/client/router';
import ImageFader from '../Common/ImageFader';
import { defineMessages, FormattedMessage } from 'react-intl';
import Transition from '../Transition';

const messages = defineMessages({
  signinplex: 'Sign in to continue',
});

const Login: React.FC = () => {
  const [error, setError] = useState('');
  const [isProcessing, setProcessing] = useState(false);
  const [authToken, setAuthToken] = useState<string | undefined>(undefined);
  const { user, revalidate } = useUser();
  const router = useRouter();

  // Effect that is triggered when the `authToken` comes back from the Plex OAuth
  // We take the token and attempt to login. If we get a success message, we will
  // ask swr to revalidate the user which _shouid_ come back with a valid user.
  useEffect(() => {
    const login = async () => {
      setProcessing(true);
      try {
        const response = await axios.post('/api/v1/auth/login', { authToken });

        if (response.data?.email) {
          revalidate();
        }
      } catch (e) {
        setError(e.response.data.message);
        setAuthToken(undefined);
        setProcessing(false);
      }
    };
    if (authToken) {
      login();
    }
  }, [authToken, revalidate]);

  // Effect that is triggered whenever `useUser`'s user changes. If we get a new
  // valid user, we redirect the user to the home page as the login was successful.
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <ImageFader
        backgroundImages={[
          '/images/rotate1.jpg',
          '/images/rotate2.jpg',
          '/images/rotate3.jpg',
          '/images/rotate4.jpg',
        ]}
      />
      <div className="px-4 sm:px-2 md:px-0 sm:mx-auto sm:w-full sm:max-w-md relative z-50">
        <img
          src="/logo.png"
          className="mx-auto max-h-32 w-auto"
          alt="Overseerr Logo"
        />
        <h2 className="mt-2 text-center text-3xl leading-9 font-extrabold text-gray-100">
          <FormattedMessage {...messages.signinplex} />
        </h2>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-50">
        <div
          className="bg-gray-800 bg-opacity-50 py-8 px-4 shadow sm:rounded-lg sm:px-10"
          style={{ backdropFilter: 'blur(5px)' }}
        >
          <Transition
            show={!!error}
            enter="opacity-0 transition duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="opacity-100 transition duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="rounded-md bg-red-600 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-300"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-300">{error}</h3>
                </div>
              </div>
            </div>
          </Transition>
          <PlexLoginButton
            isProcessing={isProcessing}
            onAuthToken={(authToken) => setAuthToken(authToken)}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
