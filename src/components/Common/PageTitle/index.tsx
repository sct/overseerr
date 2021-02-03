import React from 'react';
import useSettings from '../../../hooks/useSettings';
import Head from 'next/head';

interface PageTitleProps {
  title: string;
}

const PageTitle: React.FC<PageTitleProps> = ({ title }) => {
  const settings = useSettings();
  return (
    <Head>
      <title>
        {title} - {settings.currentSettings.applicationTitle}
      </title>
    </Head>
  );
};

export default PageTitle;
