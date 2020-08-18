import React, { useState } from 'react';
import { NextPage } from 'next';
import PlexLoginButton from '../components/PlexLoginButton';

const PlexText: NextPage = () => {
  const [authToken, setAuthToken] = useState<string>('');
  return (
    <div>
      <PlexLoginButton onAuthToken={(authToken) => setAuthToken(authToken)} />
      <div className="mt-4">Auth Token: {authToken}</div>
    </div>
  );
};

export default PlexText;
