import Link from 'next/link';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';
import { StatusResponse } from '../../../../server/interfaces/api/settingsInterfaces';

const messages = defineMessages({
  streamdevelop: 'Overseerr Develop',
  streamstable: 'Overseerr Stable',
  outofdate: 'Out of Date',
  commitsbehind:
    '{commitsBehind} {commitsBehind, plural, one {commit} other {commits}} behind',
});

const VersionStatus: React.FC = () => {
  const intl = useIntl();
  const { data } = useSWR<StatusResponse>('/api/v1/status', {
    refreshInterval: 60 * 1000,
  });

  if (!data) {
    return null;
  }

  const versionStream =
    data.commitTag === 'local'
      ? 'Keep it up! 👍'
      : data.version.startsWith('develop-')
      ? intl.formatMessage(messages.streamdevelop)
      : intl.formatMessage(messages.streamstable);

  return (
    <Link href="/settings/about">
      <a
        className={`flex items-center p-2 mx-2 text-xs transition duration-300 rounded-lg ring-1 ring-gray-700 ${
          data.updateAvailable
            ? 'bg-yellow-500 text-white hover:bg-yellow-400'
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
        }`}
      >
        {data.commitTag === 'local' ? (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
        ) : data.version.startsWith('develop-') ? (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
            />
          </svg>
        ) : (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
            />
          </svg>
        )}
        <div className="flex flex-col flex-1 min-w-0 px-2 truncate last:pr-0">
          <span className="font-bold">{versionStream}</span>
          <span className="truncate">
            {data.commitTag === 'local' ? (
              '(⌐■_■)'
            ) : data.commitsBehind > 0 ? (
              intl.formatMessage(messages.commitsbehind, {
                commitsBehind: data.commitsBehind,
              })
            ) : data.commitsBehind === -1 ? (
              intl.formatMessage(messages.outofdate)
            ) : (
              <code className="p-0 bg-transparent">
                {data.version.replace('develop-', '')}
              </code>
            )}
          </span>
        </div>
        {data.updateAvailable && (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z"
            />
          </svg>
        )}
      </a>
    </Link>
  );
};

export default VersionStatus;
