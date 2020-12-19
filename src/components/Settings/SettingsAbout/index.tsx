import React from 'react';
import useSWR from 'swr';
import Error from '../../../pages/_error';
import List from '../../Common/List';
import LoadingSpinner from '../../Common/LoadingSpinner';
import { SettingsAboutResponse } from '../../../../server/interfaces/api/settingsInterfaces';
import { defineMessages, FormattedNumber, useIntl } from 'react-intl';
import Releases from './Releases';

const messages = defineMessages({
  overseerrinformation: 'Overseerr Information',
  version: 'Version',
  totalmedia: 'Total Media',
  totalrequests: 'Total Requests',
  gettingsupport: 'Getting Support',
  githubdiscussions: 'GitHub Discussions',
  clickheretojoindiscord: 'Click here to join our Discord server.',
  timezone: 'Timezone',
  supportoverseerr: 'Support Overseerr',
  helppaycoffee: 'Help pay for coffee',
});

const SettingsAbout: React.FC = () => {
  const intl = useIntl();
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
        <List title={intl.formatMessage(messages.overseerrinformation)}>
          <List.Item title={intl.formatMessage(messages.version)}>
            {data.version}
          </List.Item>
          <List.Item title={intl.formatMessage(messages.totalmedia)}>
            <FormattedNumber value={data.totalMediaItems} />
          </List.Item>
          <List.Item title={intl.formatMessage(messages.totalrequests)}>
            <FormattedNumber value={data.totalRequests} />
          </List.Item>
          {data.tz && (
            <List.Item title={intl.formatMessage(messages.timezone)}>
              {data.tz}
            </List.Item>
          )}
        </List>
      </div>
      <div className="mb-8">
        <List title={intl.formatMessage(messages.gettingsupport)}>
          <List.Item title={intl.formatMessage(messages.githubdiscussions)}>
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
              {intl.formatMessage(messages.clickheretojoindiscord)}
            </a>
          </List.Item>
        </List>
      </div>
      <div className="mb-8">
        <List title={intl.formatMessage(messages.supportoverseerr)}>
          <List.Item
            title={`☕️ ${intl.formatMessage(messages.helppaycoffee)}`}
          >
            <a
              href="https://patreon.com/overseerr"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-500 hover:underline"
            >
              https://patreon.com/overseerr
            </a>
          </List.Item>
        </List>
      </div>
      <div className="mb-8">
        <Releases currentVersion={data.version} />
      </div>
    </>
  );
};

export default SettingsAbout;
