import Alert from '@app/components/Common/Alert';
import PlexLoginButton from '@app/components/PlexLoginButton';
import { useUser } from '@app/hooks/useUser';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  welcome: 'Welcome to Overseerr',
  signinMessage: 'Get started by signing in with your Plex account',
  loginError: 'Sign-in failed',
});

interface LoginWithPlexProps {
  onComplete: () => void;
}

const LoginWithPlex = ({ onComplete }: LoginWithPlexProps) => {
  const intl = useIntl();
  const [authToken, setAuthToken] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user, revalidate } = useUser();

  // Effect that is triggered when the `authToken` comes back from the Plex OAuth
  // We take the token and attempt to login. If we get a success message, we will
  // ask swr to revalidate the user which _shouid_ come back with a valid user.

  useEffect(() => {
    const login = async () => {
      if (!authToken) return;
      setIsProcessing(true);
      setError(null);
      try {
        const response = await axios.post('/api/v1/auth/plex', { authToken });

        if (response.data?.id) {
          revalidate();
        } else {
          setError('Unable to authenticate. Please try again.');
        }
      } catch (e) {
        const message =
          e.response?.data?.message ||
          e.message ||
          'Unable to authenticate. Please try again.';
        setError(message);
      } finally {
        setIsProcessing(false);
      }
    };
    login();
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
      {error && (
        <div className="mb-4">
          <Alert title={intl.formatMessage(messages.loginError)} type="error">
            {error}
          </Alert>
        </div>
      )}
      <div className="flex items-center justify-center">
        <PlexLoginButton
          onAuthToken={(token) => {
            setError(null);
            setAuthToken(token);
          }}
          onError={(msg) => setError(msg)}
          isProcessing={isProcessing}
        />
      </div>
    </form>
  );
};

export default LoginWithPlex;
