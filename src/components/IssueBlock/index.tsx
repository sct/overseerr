import {
  CalendarIcon,
  ExclamationIcon,
  EyeIcon,
  UserIcon,
} from '@heroicons/react/solid';
import Link from 'next/link';
import React from 'react';
import { useIntl } from 'react-intl';
import type Issue from '../../../server/entity/Issue';
import { useUser } from '../../hooks/useUser';
import Button from '../Common/Button';
import { issueOptions } from '../IssueModal/constants';

interface IssueBlockProps {
  issue: Issue;
}

const IssueBlock: React.FC<IssueBlockProps> = ({ issue }) => {
  const { user } = useUser();
  const intl = useIntl();
  const issueOption = issueOptions.find(
    (opt) => opt.issueType === issue.issueType
  );

  if (!issueOption) {
    return null;
  }

  return (
    <div className="px-4 py-3 text-gray-300">
      <div className="flex items-center justify-between">
        <div className="flex-col items-center flex-1 min-w-0 mr-6 text-sm leading-5">
          <div className="flex flex-nowrap">
            <ExclamationIcon className="flex-shrink-0 mr-1.5 h-5 w-5" />
            <span className="w-40 truncate md:w-auto">
              {intl.formatMessage(issueOption.name)}
            </span>
          </div>
          <div className="flex mb-1 flex-nowrap white">
            <UserIcon className="min-w-0 flex-shrink-0 mr-1.5 h-5 w-5" />
            <span className="w-40 truncate md:w-auto">
              <Link
                href={
                  issue.createdBy.id === user?.id
                    ? '/profile'
                    : `/users/${issue.createdBy.id}`
                }
              >
                <a className="font-semibold text-gray-100 transition duration-300 hover:text-white hover:underline">
                  {issue.createdBy.displayName}
                </a>
              </Link>
            </span>
          </div>
          <div className="flex mb-1 flex-nowrap white">
            <CalendarIcon className="min-w-0 flex-shrink-0 mr-1.5 h-5 w-5" />
            <span className="w-40 truncate md:w-auto">
              {intl.formatDate(issue.createdAt, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap flex-shrink-0 ml-2">
          <Link href={`/issues/${issue.id}`} passHref>
            <Button buttonType="primary" as="a">
              <EyeIcon />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default IssueBlock;
