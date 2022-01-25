import { ArrowCircleRightIcon } from '@heroicons/react/outline';
import type { NextPage } from 'next';
import Link from 'next/link';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import PageTitle from '../components/Common/PageTitle';
import type { Undefinable } from '../utils/typeHelpers';

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
              statusCode,
              error: getErrorMessage(statusCode),
            })
          : getErrorMessage(statusCode)}
      </div>
      <Link href="/">
        <a className="mt-2 flex">
          {intl.formatMessage(messages.returnHome)}
          <ArrowCircleRightIcon className="ml-2 h-6 w-6" />
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
