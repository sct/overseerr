import React from 'react';
import PlexLoginButton from '../PlexLoginButton';

const Login: React.FC = () => {
  return (
    <div className="w-full">
      <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="flex justify-center text-gray-900 font-bold text-xl mb-2">
          Overseerr
        </div>
        <div className="flex justify-center text-gray-900 text-sm pb-6 mb-2">
          would like to sign in to your Plex account
        </div>
        <div className="flex items-center justify-center">
          <PlexLoginButton
            onAuthToken={(authToken) =>
              console.log(`auth token is: ${authToken}`)
            }
          />
        </div>
      </form>
      <p className="text-center text-gray-500 text-xs">
        &copy;2020 Overseerr. All rights reserved.
      </p>
    </div>
  );
};

export default Login;
