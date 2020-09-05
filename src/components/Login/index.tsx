import React, { useEffect, useState } from 'react';
import PlexLoginButton from '../PlexLoginButton';
import { useUser } from '../../hooks/useUser';
import axios from 'axios';
import { useRouter } from 'next/dist/client/router';

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

      if (response.data?.status === 'OK') {
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
    <div className="w-full pt-10">
      <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="flex justify-center text-gray-900 font-bold text-xl mb-2">
          Overseerr
        </div>
        <div className="flex justify-center text-gray-900 text-sm pb-6 mb-2">
          would like to sign in to your Plex account
        </div>
        <div className="flex items-center justify-center">
          <PlexLoginButton
            onAuthToken={(authToken) => setAuthToken(authToken)}
          />
        </div>
      </form>
    </div>
  );
};

export default Login;
