import { ArrowCircleRightIcon } from '@heroicons/react/outline';
import Link from 'next/link';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import PageTitle from '../components/Common/PageTitle';

const messages = defineMessages({
  errormessagewithcode: '{statusCode} - {error}',
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
          statusCode: 404,
          error: intl.formatMessage(messages.pagenotfound),
        })}
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

export default Custom404;
