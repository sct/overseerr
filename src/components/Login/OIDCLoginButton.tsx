import { useAuth0 } from '@auth0/auth0-react';
import { LoginIcon } from '@heroicons/react/outline';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import globalMessages from '../../i18n/globalMessages';

const messages = defineMessages({
  signinwithoidc: 'Sign In',
  signingin: 'Signing In…',
  loginerror: 'Something went wrong while trying to sign in.',
});

interface OIDCLoginButtonProps {
  revalidate: () => void;
  setError: (message: string) => void;
}

const OIDCLoginButton: React.FC<OIDCLoginButtonProps> = ({
  revalidate,
  setError,
}) => {
  const intl = useIntl();
  const { isLoading, isAuthenticated, loginWithPopup, getAccessTokenSilently } =
    useAuth0();
  const [isProcessing, setProcessing] = useState(false);

  useEffect(() => {
    const login = async () => {
      setProcessing(true);
      try {
        const token = await getAccessTokenSilently();
        // eslint-disable-next-line
        const response = await axios.get('/api/v1/auth/oidc', {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {
        setError(intl.formatMessage(messages.loginerror));
        setProcessing(false);
      } finally {
        revalidate();
      }
    };
    if (isAuthenticated) {
      login();
    }
  }, [isAuthenticated, revalidate]);

  return (
    <span className="block w-full rounded-md shadow-sm">
      <button
        type="button"
        onClick={() => loginWithPopup()}
        disabled={isLoading || isProcessing}
        className="plex-button"
      >
        <LoginIcon />
        <span>
          {isLoading
            ? intl.formatMessage(globalMessages.loading)
            : intl.formatMessage(messages.signinwithoidc)}
        </span>
      </button>
    </span>
  );
};

export default OIDCLoginButton;
