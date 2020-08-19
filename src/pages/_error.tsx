import React from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { Undefinable } from '../utils/typeHelpers';

interface ErrorProps {
  statusCode?: number;
}

const getErrorMessage = (statusCode?: number) => {
  switch (statusCode) {
    case 404:
      return 'Page not found.';
    default:
      return 'Something went wrong.';
  }
};

const Error: NextPage<ErrorProps> = ({ statusCode }) => {
  return (
    <div className="flex items-center justify-center relative top-0 left-0 bottom-0 right-0 h-screen flex-col">
      <div className="text-4xl">{statusCode ? statusCode : 'Oops'}</div>
      <p>
        {getErrorMessage(statusCode)}{' '}
        <Link href="/">
          <a>Go home</a>
        </Link>
      </p>
    </div>
  );
};

Error.getInitialProps = async ({ res, err }): Promise<ErrorProps> => {
  // Apologies for how gross ternary is but this is just temporary. Honestly,
  // blame the nextjs docs
  let statusCode: Undefinable<number>;
  if (!!res) {
    statusCode = res.statusCode;
  } else {
    statusCode = err ? err.statusCode : undefined;
  }

  return { statusCode };
};

export default Error;
