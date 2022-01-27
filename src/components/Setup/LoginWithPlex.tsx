import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useUser } from '../../hooks/useUser';
import PlexLoginButton from '../PlexLoginButton';

const messages = defineMessages({
  welcome: 'Welcome to Overseerr',
  signinMessage: 'Get started by signing in with your Plex account',
});

interface LoginWithPlexProps {
  onComplete: () => void;
}

const LoginWithPlex: React.FC<LoginWithPlexProps> = ({ onComplete }) => {
  const intl = useIntl();
  const [authToken, setAuthToken] = useState<string | undefined>(undefined);
  const { user, revalidate } = useUser();

  // Effect that is triggered when the `authToken` comes back from the Plex OAuth
  // We take the token and attempt to login. If we get a success message, we will
  // ask swr to revalidate the user which _shouid_ come back with a valid user.

  useEffect(() => {
    const login = async () => {
      const response = await axios.post('/api/v1/auth/plex', { authToken });

      if (response.data?.id) {
        revalidate();
      }
    };
    if (authToken) {
      login();
    }
  }, [authToken, revalidate]);

  // Effect that is triggered whenever `useUser`'s user changes. If we get a new
  // valid user, we call onComplete which will take us to the next step in Setup.
  useEffect(() => {
    if (user) {
      onComplete();
    }
  }, [user, onComplete]);

  return (
    <form>
      <div className="mb-2 flex justify-center text-xl font-bold">
        {intl.formatMessage(messages.welcome)}
      </div>
      <div className="mb-2 flex justify-center pb-6 text-sm">
        {intl.formatMessage(messages.signinMessage)}
      </div>
      <div className="flex items-center justify-center">
        <PlexLoginButton onAuthToken={(authToken) => setAuthToken(authToken)} />
      </div>
    </form>
  );
};

export default LoginWithPlex;
