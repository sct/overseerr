import PlexLoginButton from '@app/components/PlexLoginButton';
import { useUser } from '@app/hooks/useUser';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  loginwithplex: 'Sign In with Plex',
});

type PlexLoginProps = {
  onError: (errorMessage: string) => void;
};

const PlexLogin = ({ onError }: PlexLoginProps) => {
  const intl = useIntl();
  const router = useRouter();
  const { revalidate } = useUser();
  const [isProcessing, setProcessing] = useState(false);

  const login = async (authToken: string) => {
    setProcessing(true);
    try {
      const response = await axios.post('/api/v1/auth/plex', { authToken });

      if (response.data?.id) {
        const user = await revalidate();

        if (user) {
          router.push('/');
        }
      }
    } catch (e) {
      onError(e.response.data.message);
      setProcessing(false);
    }
  };

  return (
    <PlexLoginButton
      isProcessing={isProcessing}
      onAuthToken={login}
      textOverride={intl.formatMessage(messages.loginwithplex)}
    />
  );
};

export default PlexLogin;
