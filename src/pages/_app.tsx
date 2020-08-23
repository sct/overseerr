import React from 'react';
import '../styles/globals.css';
import App from 'next/app';
import Layout from '../components/Layout';

class CoreApp extends App {
  public render(): JSX.Element {
    const { Component, pageProps, router } = this.props;
    if (router.asPath === '/login') {
      return <Component {...pageProps} />;
    }
    return (
      <Layout>
        <Component {...pageProps} />
      </Layout>
    );
  }
}

export default CoreApp;
