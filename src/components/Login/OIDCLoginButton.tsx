import globalMessages from '@app/i18n/globalMessages';
import OIDCAuth from '@app/utils/oidc';
import { LoginIcon } from '@heroicons/react/outline';
import { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  signinwithoidc: 'Sign In With {provider}',
});

type Props = {
  revalidate: () => void;
  oidcName: string;
};

const oidcAuth = new OIDCAuth();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function OIDCLoginButton({ revalidate, oidcName }: Props) {
  const intl = useIntl();
  const [loading, setLoading] = useState(false);
  const handleClick = async () => {
    setLoading(true);
    await oidcAuth.preparePopup();
    setLoading(false);
  };

  return (
    <span className="block w-full rounded-md shadow-sm">
      <button
        className="plex-button bg-indigo-500 hover:bg-indigo-600"
        onClick={handleClick}
      >
        <LoginIcon />
        <span>
          {loading
            ? intl.formatMessage(globalMessages.loading)
            : intl.formatMessage(messages.signinwithoidc, {
                provider: oidcName,
              })}
        </span>
      </button>
    </span>
  );
}

export default OIDCLoginButton;
