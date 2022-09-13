import PlexLoginButton from '@app/components/PlexLoginButton';
import { useUser } from '@app/hooks/useUser';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  signinwithplex: 'Sign In with Plex',
});

type LoginWithPlexProps = Omit<
  React.ComponentPropsWithoutRef<typeof PlexLoginButton>,
  'onAuthToken'
> & {
  onComplete: () => void;
};

const LoginWithPlex = ({
  onComplete,
  ...plexLoginButtonProps
}: LoginWithPlexProps) => {
  const intl = useIntl();
  const [authToken, setAuthToken] = useState<string | undefined>(undefined);
  const { revalidate } = useUser();

  // Effect that is triggered when the `authToken` comes back from the Plex OAuth
  // We take the token and attempt to login. If we get a success message, we will
  // ask swr to revalidate the user which _shouid_ come back with a valid user.

  useEffect(() => {
    const login = async () => {
      const response = await axios.post('/api/v1/auth/plex', { authToken });

      if (response.data?.id) {
        const user = await revalidate();
        if (user) {
          setAuthToken(undefined);
          onComplete();
        }
      }
    };
    if (authToken) {
      login();
    }
  }, [authToken, revalidate, onComplete]);

  return (
    <form>
      <div className="flex items-center justify-center">
        <PlexLoginButton
          onAuthToken={(authToken) => setAuthToken(authToken)}
          textOverride={intl.formatMessage(messages.signinwithplex)}
          {...plexLoginButtonProps}
        />
      </div>
    </form>
  );
};

export default LoginWithPlex;
