import React from 'react';
import '../styles/globals.css';
import App, { AppInitialProps } from 'next/app';
import { SWRConfig } from 'swr';
import Layout from '../components/Layout';
import { UserContext } from '../context/UserContext';
import axios from 'axios';
import { User } from '../hooks/useUser';

// Custom types so we can correctly type our GetInitialProps function
// with our combined user prop
// This is specific to _app.tsx. Other pages will not need to do this!
type NextAppComponentType = typeof App;
type GetInitialPropsFn = NextAppComponentType['getInitialProps'];

interface AppProps {
  user: User;
}

class CoreApp extends App<AppProps> {
  public static getInitialProps: GetInitialPropsFn = async (initialProps) => {
    // Run the default getInitialProps for the main nextjs initialProps
    const appInitialProps: AppInitialProps = await App.getInitialProps(
      initialProps
    );
    const { ctx, router } = initialProps;
    let user = undefined;
    try {
      // Attempt to get the user by running a request to the local api
      const response = await axios.get<User>(
        `http://localhost:${process.env.PORT || 3000}/api/v1/auth/me`,
        { headers: ctx.req ? { cookie: ctx.req.headers.cookie } : undefined }
      );
      user = response.data;
    } catch (e) {
      // If there is no user, and ctx.res is set (to check if we are on the server side)
      // _AND_ we are not already on the login or setup route, redirect to /login with a 307
      // before anything actually renders
      if (ctx.res && !router.pathname.match(/(login|setup)/)) {
        ctx.res.writeHead(307, {
          Location: '/login',
        });
        ctx.res.end();
      }
    }

    return { ...appInitialProps, user };
  };

  public render(): JSX.Element {
    const { Component, pageProps, router, user } = this.props;

    let component: React.ReactNode;

    if (router.asPath === '/login') {
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
        <UserContext initialUser={user}>{component}</UserContext>
      </SWRConfig>
    );
  }
}

export default CoreApp;
