import React, { useState } from 'react';
import PlexOAuth from '../../utils/plex';

const plexOAuth = new PlexOAuth();

interface PlexLoginButtonProps {
  onAuthToken: (authToken: string) => void;
  onError?: (message: string) => void;
}

const PlexLoginButton: React.FC<PlexLoginButtonProps> = ({
  onAuthToken,
  onError,
}) => {
  const [loading, setLoading] = useState<boolean>(false);

  const getPlexLogin = async () => {
    setLoading(true);
    try {
      const authToken = await plexOAuth.login();
      onAuthToken(authToken);
      setLoading(false);
    } catch (e) {
      if (onError) {
        onError(e.message);
      }
      setLoading(false);
    }
  };
  return (
    <span className="block w-full rounded-md shadow-sm">
      <button
        type="button"
        onClick={() => {
          plexOAuth.preparePopup();
          setTimeout(() => getPlexLogin(), 1500);
        }}
        disabled={loading}
        className="plex-button"
      >
        {loading ? 'Loading...' : 'Login with Plex'}
      </button>
    </span>
  );
};

export default PlexLoginButton;
