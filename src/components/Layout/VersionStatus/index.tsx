import { ArrowUpCircleIcon } from '@heroicons/react/24/outline';
import type { StatusResponse } from '@server/interfaces/api/settingsInterfaces';
import Link from 'next/link';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages({
  updatetoseerr: 'Update to Seerr',
  migrationavailable: 'Migration Available',
});

interface VersionStatusProps {
  onClick?: () => void;
}

const VersionStatus = ({ onClick }: VersionStatusProps) => {
  const intl = useIntl();
  const { data } = useSWR<StatusResponse>('/api/v1/status', {
    refreshInterval: 60 * 1000,
  });

  if (!data) {
    return null;
  }

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
        className="mx-2 flex items-center rounded-lg bg-yellow-500 p-2 text-xs text-white ring-1 ring-gray-700 transition duration-300 hover:bg-yellow-400"
      >
        <ArrowUpCircleIcon className="h-6 w-6" />
        <div className="flex min-w-0 flex-1 flex-col truncate px-2 last:pr-0">
          <span className="font-bold">
            {intl.formatMessage(messages.updatetoseerr)}
          </span>
          <span className="truncate">
            {intl.formatMessage(messages.migrationavailable)}
          </span>
        </div>
      </a>
    </Link>
  );
};

export default VersionStatus;
