import React from 'react';
import type { NextPage } from 'next';
import Link from 'next/link';
import type { Undefinable } from '../utils/typeHelpers';
import { defineMessages, useIntl } from 'react-intl';
import PageTitle from '../components/Common/PageTitle';

interface ErrorProps {
  statusCode?: number;
}

const messages = defineMessages({
  errormessagewithcode: '{statusCode} - {error}',
  internalservererror: 'Internal Server Error',
  serviceunavailable: 'Service Unavailable',
  somethingwentwrong: 'Something Went Wrong',
  oops: 'Oops',
  returnHome: 'Return Home',
});

const Error: NextPage<ErrorProps> = ({ statusCode }) => {
  const intl = useIntl();

  const getErrorMessage = (statusCode?: number) => {
    switch (statusCode) {
      case 500:
        return intl.formatMessage(messages.internalservererror);
      case 503:
        return intl.formatMessage(messages.serviceunavailable);
      default:
        return statusCode
          ? intl.formatMessage(messages.somethingwentwrong)
          : intl.formatMessage(messages.oops);
    }
  };
  return (
    <div className="error-message">
      <PageTitle title={getErrorMessage(statusCode)} />
      <div className="text-4xl">
        {statusCode
          ? intl.formatMessage(messages.errormessagewithcode, {
              statusCode: statusCode,
              message: getErrorMessage(statusCode),
            })
          : getErrorMessage(statusCode)}
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

Error.getInitialProps = async ({ res, err }): Promise<ErrorProps> => {
  // Apologies for how gross ternary is but this is just temporary. Honestly,
  // blame the nextjs docs
  let statusCode: Undefinable<number>;
  if (res) {
    statusCode = res.statusCode;
  } else {
    statusCode = err ? err.statusCode : undefined;
  }

  return { statusCode };
};

export default Error;
