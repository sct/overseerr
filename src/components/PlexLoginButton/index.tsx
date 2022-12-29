import Button from '@app/components/Common/Button';
import globalMessages from '@app/i18n/globalMessages';
import PlexOAuth from '@app/utils/plex';
import { LoginIcon } from '@heroicons/react/outline';
import { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  signinwithplex: 'Sign In',
  signingin: 'Signing In…',
});

const plexOAuth = new PlexOAuth();

type PlexLoginButtonProps = Pick<
  React.ComponentPropsWithoutRef<typeof Button>,
  'buttonSize' | 'buttonType'
> & {
  onAuthToken: (authToken: string) => void;
  isProcessing?: boolean;
  onError?: (message: string) => void;
  textOverride?: string;
  svgIcon?: React.ReactNode;
  disabled?: boolean;
};

const PlexLoginButton = ({
  onAuthToken,
  onError,
  isProcessing,
  textOverride,
  buttonType = 'plex',
  buttonSize,
  svgIcon,
  disabled,
}: PlexLoginButtonProps) => {
  const intl = useIntl();
  const [loading, setLoading] = useState(false);

  const getPlexLogin = async () => {
    setLoading(true);
    try {
      const authToken = await plexOAuth.login();
      setLoading(false);
      onAuthToken(authToken);
    } catch (e) {
      if (onError) {
        onError(e.message);
      }
      setLoading(false);
    }
  };
  return (
    <span className="block w-full rounded-md shadow-sm">
      <Button
        type="button"
        onClick={() => {
          plexOAuth.preparePopup();
          setTimeout(() => getPlexLogin(), 1500);
        }}
        disabled={loading || isProcessing || disabled}
        buttonType={buttonType}
        buttonSize={buttonSize}
      >
        {svgIcon ?? <LoginIcon />}
        <span>
          {loading
            ? intl.formatMessage(globalMessages.loading)
            : isProcessing
            ? intl.formatMessage(messages.signingin)
            : textOverride
            ? textOverride
            : intl.formatMessage(messages.signinwithplex)}
        </span>
      </Button>
    </span>
  );
};

export default PlexLoginButton;
