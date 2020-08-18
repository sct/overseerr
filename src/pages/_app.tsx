import React from 'react';
import '../styles/globals.css';
import App from 'next/app';

class CoreApp extends App {
  public render(): JSX.Element {
    const { Component, pageProps } = this.props;
    return <Component {...pageProps} />;
  }
}

export default CoreApp;
