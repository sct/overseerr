import Link from 'next/link';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import PageTitle from '../components/Common/PageTitle';

const messages = defineMessages({
  errormessagewithcode: '404 - {error}',
  pagenotfound: 'Page Not Found',
  returnHome: 'Return Home',
});

const Custom404: React.FC = () => {
  const intl = useIntl();

  return (
    <div className="error-message">
      <PageTitle title={intl.formatMessage(messages.pagenotfound)} />
      <div className="text-4xl">
        {intl.formatMessage(messages.errormessagewithcode, {
          error: intl.formatMessage(messages.pagenotfound),
        })}
      </div>
      <Link href="/">
        <a className="flex">
          {intl.formatMessage(messages.returnHome)}
          <svg
            className="w-6 h-6 ml-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </a>
      </Link>
    </div>
  );
};

export default Custom404;
