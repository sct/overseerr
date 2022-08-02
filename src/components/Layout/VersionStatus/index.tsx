import {
  ArrowCircleUpIcon,
  BeakerIcon,
  CodeIcon,
  ServerIcon,
} from '@heroicons/react/outline';
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

interface VersionStatusProps {
  onClick?: () => void;
}

const VersionStatus: React.FC<VersionStatusProps> = ({ onClick }) => {
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
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onClick) {
            onClick();
          }
        }}
        role="button"
        tabIndex={0}
        className={`mx-2 flex items-center rounded-lg p-2 text-xs ring-1 ring-gray-700 transition duration-300 ${
          data.updateAvailable
            ? 'bg-yellow-500 text-white hover:bg-yellow-400'
            : 'bg-gray-900 text-gray-300 hover:bg-gray-800'
        }`}
      >
        {data.commitTag === 'local' ? (
          <CodeIcon className="h-6 w-6" />
        ) : data.version.startsWith('develop-') ? (
          <BeakerIcon className="h-6 w-6" />
        ) : (
          <ServerIcon className="h-6 w-6" />
        )}
        <div className="flex min-w-0 flex-1 flex-col truncate px-2 last:pr-0">
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
              <code className="bg-transparent p-0">
                {data.version.replace('develop-', '')}
              </code>
            )}
          </span>
        </div>
        {data.updateAvailable && <ArrowCircleUpIcon className="h-6 w-6" />}
      </a>
    </Link>
  );
};

export default VersionStatus;
