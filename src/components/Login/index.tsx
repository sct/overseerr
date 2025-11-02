import Accordion from '@app/components/Common/Accordion';
import ImageFader from '@app/components/Common/ImageFader';
import PageTitle from '@app/components/Common/PageTitle';
import LanguagePicker from '@app/components/Layout/LanguagePicker';
import LocalLogin from '@app/components/Login/LocalLogin';
import PlexLoginButton from '@app/components/PlexLoginButton';
import useSettings from '@app/hooks/useSettings';
import { useUser } from '@app/hooks/useUser';
import { Transition } from '@headlessui/react';
import { XCircleIcon } from '@heroicons/react/24/solid';
import axios from 'axios';
import { useRouter } from 'next/dist/client/router';
import { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages({
  signin: 'Sign In',
  signinheader: 'Sign in to continue',
  signinwithplex: 'Use your Plex account',
  signinwithoverseerr: 'Use your {applicationTitle} account',
});

const Login = () => {
  const intl = useIntl();
  const [error, setError] = useState('');
  const [isProcessing, setProcessing] = useState(false);
  const [authToken, setAuthToken] = useState<string | undefined>(undefined);
  const { user, revalidate } = useUser();
  const router = useRouter();
  const settings = useSettings();

  // Effect that is triggered when the `authToken` comes back from the Plex OAuth
  // We take the token and attempt to sign in. If we get a success message, we will
  // ask swr to revalidate the user which _should_ come back with a valid user.
  useEffect(() => {
    const login = async () => {
      setProcessing(true);
      try {
        const response = await axios.post('/api/v1/auth/plex', { authToken });

        if (response.data?.id) {
          revalidate();
        }
      } catch (e) {
        setError(e.response.data.message);
        setAuthToken(undefined);
        setProcessing(false);
      }
    };
    if (authToken) {
      login();
    }
  }, [authToken, revalidate]);

  // Effect that is triggered whenever `useUser`'s user changes. If we get a new
  // valid user, we redirect the user to the home page as the login was successful.
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const { data: backdrops } = useSWR<string[]>('/api/v1/backdrops', {
    refreshInterval: 0,
    refreshWhenHidden: false,
    revalidateOnFocus: false,
  });

  return (
    <div className="relative flex min-h-screen flex-col bg-tv-bg py-14">
      <PageTitle title={intl.formatMessage(messages.signin)} />
      <ImageFader
        backgroundImages={
          backdrops?.map(
            (backdrop) => `https://image.tmdb.org/t/p/original${backdrop}`
          ) ?? []
        }
      />
      <div className="absolute top-4 right-4 z-50">
        <LanguagePicker />
      </div>
      <div className="relative z-40 mt-10 flex flex-col items-center px-4 sm:mx-auto sm:w-full sm:max-w-md">
        <img src="/logo_stacked.svg" className="mb-10 max-w-full" alt="Logo" />
        <h2 className="mt-2 text-center text-3xl font-extrabold leading-9 text-tv-text">
          {intl.formatMessage(messages.signinheader)}
        </h2>
      </div>
      <div className="relative z-50 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div
          className="bg-tv-card/90 border border-tv-border shadow-tv-lg sm:rounded-tv-xl"
          style={{ backdropFilter: 'blur(60px)', WebkitBackdropFilter: 'blur(60px)' }}
        >
          <>
            <Transition
              as="div"
              show={!!error}
              enter="transition-opacity duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="mb-4 rounded-tv bg-tv-error/20 border border-tv-error/50 p-4 backdrop-blur-glass"
                style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    <XCircleIcon className="h-5 w-5 text-tv-error" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-tv-error">
                      {error}
                    </h3>
                  </div>
                </div>
              </div>
            </Transition>
            <Accordion single atLeastOne>
              {({ openIndexes, handleClick, AccordionContent }) => (
                <>
                  <button
                    className={`w-full cursor-default bg-tv-surface/70 py-3 text-center text-sm font-bold text-tv-text-secondary transition-all duration-200 focus:outline-none sm:rounded-t-tv-xl ${
                      openIndexes.includes(0) && 'text-tv-accent'
                    } ${
                      settings.currentSettings.localLogin &&
                      'hover:cursor-pointer hover:bg-tv-surface-light'
                    }`}
                    onClick={() => handleClick(0)}
                    disabled={!settings.currentSettings.localLogin}
                  >
                    {intl.formatMessage(messages.signinwithplex)}
                  </button>
                  <AccordionContent isOpen={openIndexes.includes(0)}>
                    <div className="px-10 py-8">
                      <PlexLoginButton
                        isProcessing={isProcessing}
                        onAuthToken={(authToken) => setAuthToken(authToken)}
                      />
                    </div>
                  </AccordionContent>
                  {settings.currentSettings.localLogin && (
                    <div>
                      <button
                        className={`w-full cursor-default bg-tv-surface/70 py-3 text-center text-sm font-bold text-tv-text-secondary transition-all duration-200 hover:cursor-pointer hover:bg-tv-surface-light focus:outline-none ${
                          openIndexes.includes(1)
                            ? 'text-tv-accent'
                            : 'sm:rounded-b-tv-xl'
                        }`}
                        onClick={() => handleClick(1)}
                      >
                        {intl.formatMessage(messages.signinwithoverseerr, {
                          applicationTitle:
                            settings.currentSettings.applicationTitle,
                        })}
                      </button>
                      <AccordionContent isOpen={openIndexes.includes(1)}>
                        <div className="px-10 py-8">
                          <LocalLogin revalidate={revalidate} />
                        </div>
                      </AccordionContent>
                    </div>
                  )}
                </>
              )}
            </Accordion>
          </>
        </div>
      </div>
    </div>
  );
};

export default Login;
