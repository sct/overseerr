import React from 'react';
import PlexLoginButton from '../PlexLoginButton';

interface LoginWithPlexProps {
  onComplete: () => void;
}

const LoginWithPlex: React.FC<LoginWithPlexProps> = ({ onComplete }) => {
  return (
    <form>
      <div className="flex justify-center font-bold text-xl mb-2">
        Welcome to Overseerr
      </div>
      <div className="flex justify-center text-sm pb-6 mb-2">
        Get started by logging in with your Plex account
      </div>
      <div className="flex items-center justify-center">
        <PlexLoginButton
          onAuthToken={(authToken) => {
            if (authToken) onComplete();
          }}
        />
      </div>
    </form>
  );
};

export default LoginWithPlex;
