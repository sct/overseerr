import React from 'react';
import useSWR from 'swr';
import Error from '../../../pages/_error';
import List from '../../Common/List';
import LoadingSpinner from '../../Common/LoadingSpinner';
import { SettingsAboutResponse } from '../../../../server/interfaces/api/settingsInterfaces';
import { FormattedNumber } from 'react-intl';

const SettingsAbout: React.FC = () => {
  const { data, error } = useSWR<SettingsAboutResponse>(
    '/api/v1/settings/about'
  );

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
      <div className="mb-8">
        <List title="Overseerr Information">
          <List.Item title="Version">{data.version}</List.Item>
          <List.Item title="Total Media">
            <FormattedNumber value={data.totalMediaItems} />
          </List.Item>
          <List.Item title="Total Requests">
            <FormattedNumber value={data.totalRequests} />
          </List.Item>
        </List>
      </div>
      <div className="mb-8">
        <List title="Getting Support">
          <List.Item title="GitHub Discussions">
            <a
              href="https://github.com/sct/overseerr/discussions"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-500 hover:underline"
            >
              https://github.com/sct/overseerr/discussions
            </a>
          </List.Item>
          <List.Item title="Discord">
            <a
              href="https://discord.gg/PkCWJSeCk7"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-500 hover:underline"
            >
              Click here to join our Discord server.
            </a>
          </List.Item>
        </List>
      </div>
    </>
  );
};

export default SettingsAbout;
