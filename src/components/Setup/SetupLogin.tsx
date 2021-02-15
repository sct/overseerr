import React, { useEffect, useState } from 'react';
import { useUser } from '../../hooks/useUser';
import PlexLoginButton from '../PlexLoginButton';
import JellyfinLogin from '../Login/JellyfinLogin';
import axios from 'axios';
import { defineMessages, FormattedMessage } from 'react-intl';
import LoadingSpinner from '../Common/LoadingSpinner';

const messages = defineMessages({
  welcome: 'Welcome to Overseerr',
  signinMessage: 'Get started by logging in with an account',
  signinWithJellyfin: 'Use Jellyfin',
});

interface LoginWithMediaServerProps {
  onComplete: () => void;
}

const SetupLogin: React.FC<LoginWithMediaServerProps> = ({ onComplete }) => {
  const [authToken, setAuthToken] = useState<string | undefined>(undefined);
  const [mediaServerType, setMediaServerType] = useState<string>('');
  const { user, revalidate } = useUser();

  // Effect that is triggered when the `authToken` comes back from the Plex OAuth
  // We take the token and attempt to login. If we get a success message, we will
  // ask swr to revalidate the user which _shouid_ come back with a valid user.

  useEffect(() => {
    const login = async () => {
      const response = await axios.post('/api/v1/auth/login', {
        authToken: authToken,
      });

      if (response.data?.email) {
        revalidate();
      }
    };
    if (authToken && mediaServerType == 'PLEX') {
      login();
    }
  }, [authToken, mediaServerType, revalidate]);

  useEffect(() => {
    if (user) {
      onComplete();
    }
  }, [user, onComplete]);

  return (
    <div>
      {mediaServerType == '' ? (
        <React.Fragment>
          <div className="flex justify-center mb-2 text-xl font-bold">
            <FormattedMessage {...messages.welcome} />
          </div>
          <div className="flex justify-center pb-6 mb-2 text-sm">
            <FormattedMessage {...messages.signinMessage} />
          </div>
          <div className="flex items-center justify-center pb-4">
            <PlexLoginButton
              onAuthToken={(authToken) => {
                setMediaServerType('PLEX');
                setAuthToken(authToken);
              }}
            />
          </div>
          <hr className="m-auto border-gray-600 w-60"></hr>
          <span className="block w-full rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => {
                setMediaServerType('JELLYFIN');
              }}
              className="jellyfin-button"
            >
              <FormattedMessage {...messages.signinWithJellyfin} />
            </button>
          </span>
        </React.Fragment>
      ) : mediaServerType == 'JELLYFIN' ? (
        <JellyfinLogin initial={true} revalidate={revalidate} />
      ) : (
        <LoadingSpinner></LoadingSpinner>
      )}
    </div>
  );
};

export default SetupLogin;
