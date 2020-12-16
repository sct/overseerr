import React, { useEffect, useState } from 'react';
import '../styles/globals.css';
import App, { AppInitialProps, AppProps } from 'next/app';
import { SWRConfig } from 'swr';
import { ToastProvider } from 'react-toast-notifications';
import { parseCookies, setCookie } from 'nookies';
import Layout from '../components/Layout';
import { UserContext } from '../context/UserContext';
import axios from 'axios';
import { User } from '../hooks/useUser';
import { IntlProvider } from 'react-intl';
import { LanguageContext, AvailableLocales } from '../context/LanguageContext';
import Head from 'next/head';
import Toast from '../components/Toast';
import { InteractionProvider } from '../context/InteractionContext';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const loadLocaleData = (locale: string): Promise<any> => {
  switch (locale) {
    case 'ja':
      return import('../i18n/locale/ja.json');
    case 'fr':
      return import('../i18n/locale/fr.json');
    case 'nb-NO':
      return import('../i18n/locale/nb_NO.json');
    case 'de':
      return import('../i18n/locale/de.json');
    case 'ru':
      return import('../i18n/locale/ru.json');
    case 'nl':
      return import('../i18n/locale/nl.json');
    case 'es':
      return import('../i18n/locale/es.json');
    default:
      return import('../i18n/locale/en.json');
  }
};

// Custom types so we can correctly type our GetInitialProps function
// with our combined user prop
// This is specific to _app.tsx. Other pages will not need to do this!
type NextAppComponentType = typeof App;
type MessagesType = Record<string, any>;

interface ExtendedAppProps extends AppProps {
  user: User;
  messages: MessagesType;
  locale: AvailableLocales;
}

if (typeof window === 'undefined') {
  global.Intl = require('intl');
}

const CoreApp: Omit<NextAppComponentType, 'origGetInitialProps'> = ({
  Component,
  pageProps,
  router,
  user,
  messages,
  locale,
}: ExtendedAppProps) => {
  let component: React.ReactNode;
  const [loadedMessages, setMessages] = useState<MessagesType>(messages);
  const [currentLocale, setLocale] = useState<AvailableLocales>(locale);

  useEffect(() => {
    loadLocaleData(currentLocale).then(setMessages);
    setCookie(null, 'locale', currentLocale, { path: '/' });
  }, [currentLocale]);

  if (router.pathname.match(/(login|setup)/)) {
    component = <Component {...pageProps} />;
  } else {
    component = (
      <Layout>
        <Component {...pageProps} />
      </Layout>
    );
  }

  return (
    <SWRConfig
      value={{
        fetcher: (url) => axios.get(url).then((res) => res.data),
      }}
    >
      <LanguageContext.Provider value={{ locale: currentLocale, setLocale }}>
        <IntlProvider
          locale={currentLocale}
          defaultLocale="en"
          messages={loadedMessages}
        >
          <InteractionProvider>
            <ToastProvider components={{ Toast }}>
              <Head>
                <title>Overseerr</title>
              </Head>
              <UserContext initialUser={user}>{component}</UserContext>
            </ToastProvider>
          </InteractionProvider>
        </IntlProvider>
      </LanguageContext.Provider>
    </SWRConfig>
  );
};

CoreApp.getInitialProps = async (initialProps) => {
  const { ctx, router } = initialProps;
  let user = undefined;

  let locale = 'en';

  if (ctx.res) {
    // Check if app is initialized and redirect if necessary
    const response = await axios.get<{ initialized: boolean }>(
      `http://localhost:${process.env.PORT || 3000}/api/v1/settings/public`
    );

    const initialized = response.data.initialized;

    if (!initialized) {
      if (!router.pathname.match(/(setup|login\/plex)/)) {
        ctx.res.writeHead(307, {
          Location: '/setup',
        });
        ctx.res.end();
      }
    } else {
      try {
        // Attempt to get the user by running a request to the local api
        const response = await axios.get<User>(
          `http://localhost:${process.env.PORT || 3000}/api/v1/auth/me`,
          { headers: ctx.req ? { cookie: ctx.req.headers.cookie } : undefined }
        );
        user = response.data;

        if (router.pathname.match(/login/)) {
          ctx.res.writeHead(307, {
            Location: '/',
          });
          ctx.res.end();
        }
      } catch (e) {
        // If there is no user, and ctx.res is set (to check if we are on the server side)
        // _AND_ we are not already on the login or setup route, redirect to /login with a 307
        // before anything actually renders
        if (!router.pathname.match(/(login|setup)/)) {
          ctx.res.writeHead(307, {
            Location: '/login',
          });
          ctx.res.end();
        }
      }
    }

    const cookies = parseCookies(ctx);

    if (cookies.locale) {
      locale = cookies.locale;
    }
  }

  // Run the default getInitialProps for the main nextjs initialProps
  const appInitialProps: AppInitialProps = await App.getInitialProps(
    initialProps
  );

  const messages = await loadLocaleData(locale);

  return { ...appInitialProps, user, messages, locale };
};

export default CoreApp;
