import React from 'react';
import '../styles/globals.css';
import App, { AppInitialProps } from 'next/app';
import { SWRConfig } from 'swr';
import Layout from '../components/Layout';
import { UserContext } from '../context/UserContext';
import axios from 'axios';
import { User } from '../hooks/useUser';

type NextAppComponentType = typeof App;
type GetInitialPropsFn = NextAppComponentType['getInitialProps'];

interface AppProps {
  user: User;
}

class CoreApp extends App<AppProps> {
  public static getInitialProps: GetInitialPropsFn = async (initialProps) => {
    const appInitialProps: AppInitialProps = await App.getInitialProps(
      initialProps
    );
    const { ctx, router } = initialProps;
    let user = undefined;
    try {
      const response = await axios.get<User>(
        'http://localhost:3000/api/v1/auth/me',
        { headers: ctx.req ? { cookie: ctx.req.headers.cookie } : undefined }
      );
      user = response.data;
    } catch (e) {
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
