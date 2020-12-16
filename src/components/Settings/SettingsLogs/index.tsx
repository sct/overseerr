import React from 'react';
import useSWR from 'swr';
import Error from '../../../pages/_error';
import LoadingSpinner from '../../Common/LoadingSpinner';
import {
  FormattedDate,
  FormattedTime,
  useIntl,
  defineMessages,
} from 'react-intl';

const messages = defineMessages({
  logs: 'Logs',
  logsDescription:
    'You can access your logs directly in stdout (container logs) or looking in /app/config/logs/overseerr.logs',
});

const SettingsLogs: React.FC = () => {
  const intl = useIntl();
  const { data, error } = useSWR('/api/v1/settings/logs');

  if (error) {
    return <Error statusCode={500} />;
  }

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-200">
          {intl.formatMessage(messages.logs)}
        </h3>
        <p className="text-sm leading-5 text-gray-500">
          {intl.formatMessage(messages.logsDescription)}
        </p>

        <div className="mt-4 text-sm">
          {data?.map((row, index) => (
            <div key={`log-list-${index}`} className="space-x-2 text-gray-300">
              <span className="inline">
                <FormattedDate
                  value={row.timestamp}
                  year="numeric"
                  month="short"
                  day="2-digit"
                />
                &nbsp;
                <FormattedTime
                  value={row.timestamp}
                  hour="numeric"
                  minute="numeric"
                  second="numeric"
                  hour12={false}
                />
              </span>
              <span className="inline">
                [{row.level}][{row.label}]:
              </span>
              <span className="inline">{row.message}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default SettingsLogs;
