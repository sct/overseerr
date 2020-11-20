import React, { useEffect, useState } from 'react';
import PlexLoginButton from '../PlexLoginButton';
import { useUser } from '../../hooks/useUser';
import axios from 'axios';
import { useRouter } from 'next/dist/client/router';
import ImageFader from '../Common/ImageFader';

const Login: React.FC = () => {
  const [authToken, setAuthToken] = useState<string | undefined>(undefined);
  const { user, revalidate } = useUser();
  const router = useRouter();

  // Effect that is triggered when the `authToken` comes back from the Plex OAuth
  // We take the token and attempt to login. If we get a success message, we will
  // ask swr to revalidate the user which _shouid_ come back with a valid user.
  useEffect(() => {
    const login = async () => {
      const response = await axios.post('/api/v1/auth/login', { authToken });

      if (response.data?.email) {
        revalidate();
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
          Log in to continue
        </h2>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-50">
        <div
          className="bg-gray-800 bg-opacity-50 py-8 px-4 shadow sm:rounded-lg sm:px-10"
          style={{ backdropFilter: 'blur(5px)' }}
        >
          <PlexLoginButton
            onAuthToken={(authToken) => setAuthToken(authToken)}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
