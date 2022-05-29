import React from 'react';

type Props = {
  revalidate: () => void;
  oidcName: string;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function OIDCLoginButton({ revalidate, oidcName }: Props) {
  const handleClick = () => {
    window.location.pathname = '/api/v1/auth/oidc-login';
  };

  return (
    <span className="block w-full rounded-md shadow-sm">
      <button
        className="plex-button bg-indigo-500 hover:bg-indigo-600"
        onClick={handleClick}
      >
        Login with {oidcName}
      </button>
    </span>
  );
}

export default OIDCLoginButton;
