import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';
import Alert from '../Common/Alert';

const messages = defineMessages({
  dockerVolumeMissing: 'Docker Volume Mount Missing',
  dockerVolumeMissingDescription:
    'The <code>/app/config</code> volume mount was not configured properly. All data will be cleared when the container is stopped or restarted.',
});

const AppDataWarning: React.FC = () => {
  const intl = useIntl();
  const { data, error } = useSWR<{ appData: boolean }>(
    '/api/v1/status/appdata'
  );

  if (!data && !error) {
    return null;
  }

  if (!data) {
    return null;
  }

  return (
    <>
      {!data.appData && (
        <Alert title={intl.formatMessage(messages.dockerVolumeMissing)}>
          {intl.formatMessage(messages.dockerVolumeMissingDescription, {
            code: function code(msg) {
              return <code className="bg-opacity-50">{msg}</code>;
            },
          })}
        </Alert>
      )}
    </>
  );
};

export default AppDataWarning;
