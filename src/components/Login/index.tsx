import ImageFader from '@app/components/Common/ImageFader';
import PageTitle from '@app/components/Common/PageTitle';
import LanguagePicker from '@app/components/Layout/LanguagePicker';
import LocalLogin from '@app/components/Login/LocalLogin';
import PlexLogin from '@app/components/Login/PlexLogin';
import useSettings from '@app/hooks/useSettings';
import { Transition } from '@headlessui/react';
import { XCircleIcon } from '@heroicons/react/solid';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/dist/client/router';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages({
  signin: 'Sign In',
  signinheader: 'Sign in to continue',
});

const Login = () => {
  const intl = useIntl();
  const [error, setError] = useState('');
  const settings = useSettings();

  const { data: backdrops } = useSWR<string[]>('/api/v1/backdrops', {
    refreshInterval: 0,
    refreshWhenHidden: false,
    revalidateOnFocus: false,
  });

  return (
    <div className="relative flex min-h-screen flex-col bg-gray-900 py-14">
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
        <h2 className="mt-2 text-center text-3xl font-extrabold leading-9 text-gray-100">
          {intl.formatMessage(messages.signinheader)}
        </h2>
      </div>
      <div className="relative z-50 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div
          className="flex flex-col bg-gray-800 bg-opacity-50 p-4 shadow sm:rounded-lg "
          style={{ backdropFilter: 'blur(5px)' }}
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
              <div className="mb-4 rounded-md bg-red-600 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <XCircleIcon className="h-5 w-5 text-red-300" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-300">
                      {error}
                    </h3>
                  </div>
                </div>
              </div>
            </Transition>
            {settings.currentSettings.plexLoginEnabled && (
              <PlexLogin onError={(msg) => setError(msg)} />
            )}
            {settings.currentSettings.plexLoginEnabled &&
              settings.currentSettings.localLogin && (
                <div className="relative flex items-center py-4">
                  <div className="flex-grow border-t border-gray-500"></div>
                  <span className="mx-4 flex-shrink text-gray-400">or</span>
                  <div className="flex-grow border-t border-gray-500"></div>
                </div>
              )}
            {settings.currentSettings.localLogin && (
              <LocalLogin onError={(msg) => setError(msg)} />
            )}
          </>
        </div>
      </div>
    </div>
  );
};

export default Login;
