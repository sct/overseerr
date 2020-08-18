import React, { useState } from 'react';
import { NextPage } from 'next';
import PlexOAuth from '../utils/plex';

const plexOAuth = new PlexOAuth();

const PlexText: NextPage = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [authToken, setAuthToken] = useState<string>('');

  const getPlexLogin = async () => {
    setLoading(true);
    try {
      const authToken = await plexOAuth.login();
      setAuthToken(authToken);
      setLoading(false);
    } catch (e) {
      console.log(e.message);
      setLoading(false);
    }
  };
  return (
    <div>
      <span className="inline-flex rounded-md shadow-sm">
        <button
          type="button"
          onClick={() => getPlexLogin()}
          disabled={loading}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base leading-6 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700 transition ease-in-out duration-150"
        >
          {loading ? 'Loading...' : 'Plex Login'}
        </button>
      </span>
      <div className="mt-4">Auth Token: {authToken}</div>
    </div>
  );
};

export default PlexText;
