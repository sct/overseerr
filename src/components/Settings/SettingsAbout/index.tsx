import { CheckIcon, XIcon } from '@heroicons/react/solid';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';
import {
  ServicesResponse,
  SettingsAboutResponse,
  StatusResponse,
} from '../../../../server/interfaces/api/settingsInterfaces';
import globalMessages from '../../../i18n/globalMessages';
import Error from '../../../pages/_error';
import Badge from '../../Common/Badge';
import List from '../../Common/List';
import LoadingSpinner from '../../Common/LoadingSpinner';
import PageTitle from '../../Common/PageTitle';
import Releases from './Releases';

const messages = defineMessages({
  about: 'About',
  overseerrinformation: 'About Overseerr',
  version: 'Version',
  totalmedia: 'Total Media',
  totalrequests: 'Total Requests',
  plex: 'Plex Server',
  services: 'Connected Services',
  gettingsupport: 'Getting Support',
  githubdiscussions: 'GitHub Discussions',
  timezone: 'Time Zone',
  supportoverseerr: 'Support Overseerr',
  helppaycoffee: 'Help Pay for Coffee',
  documentation: 'Documentation',
  preferredmethod: 'Preferred',
  outofdate: 'Out of Date',
  uptodate: 'Up to Date',
});

const CheckBadge: React.FC = () => {
  return (
    <div className="flex items-center justify-center w-4 h-4 mr-2 text-white bg-green-500 rounded-full shadow">
      <CheckIcon className="w-3 h-3" />
    </div>
  );
};

const XBadge: React.FC = () => {
  return (
    <div className="flex items-center justify-center w-4 h-4 mr-2 text-white bg-red-600 rounded-full shadow">
      <XIcon className="w-3 h-3" />
    </div>
  );
};

const SettingsAbout: React.FC = () => {
  const intl = useIntl();

  const { data, error } = useSWR<SettingsAboutResponse>(
    '/api/v1/settings/about'
  );
  const { data: status } = useSWR<StatusResponse>('/api/v1/status');
  const { data: services } = useSWR<ServicesResponse>(
    '/api/v1/status/services'
  );

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <Error statusCode={500} />;
  }

  return (
    <>
      <PageTitle
        title={[
          intl.formatMessage(messages.about),
          intl.formatMessage(globalMessages.settings),
        ]}
      />
      <div className="section">
        <List title={intl.formatMessage(messages.overseerrinformation)}>
          <List.Item
            title={intl.formatMessage(messages.version)}
            className="truncate"
          >
            <code>{data.version.replace('develop-', '')}</code>
            {status?.updateAvailable ? (
              <Badge badgeType="warning" className="ml-2">
                {intl.formatMessage(messages.outofdate)}
              </Badge>
            ) : (
              status?.commitTag !== 'local' && (
                <Badge badgeType="success" className="ml-2">
                  {intl.formatMessage(messages.uptodate)}
                </Badge>
              )
            )}
          </List.Item>
          <List.Item title={intl.formatMessage(messages.totalmedia)}>
            {intl.formatNumber(data.totalMediaItems)}
          </List.Item>
          <List.Item title={intl.formatMessage(messages.totalrequests)}>
            {intl.formatNumber(data.totalRequests)}
          </List.Item>
          {data.tz && (
            <List.Item title={intl.formatMessage(messages.timezone)}>
              <code>{data.tz}</code>
            </List.Item>
          )}
          {services?.plex && (
            <List.Item
              title={intl.formatMessage(messages.plex)}
              className="flex items-center"
            >
              {services.plex.connected ? <CheckBadge /> : <XBadge />}
              {services.plex.url ? (
                <a
                  href={services.plex.url}
                  target="_blank"
                  rel="noreferrer"
                  className="transition duration-300 hover:underline"
                >
                  {services.plex.name}
                </a>
              ) : (
                services.plex.name
              )}
            </List.Item>
          )}
          {(!!services?.radarr.length || !!services?.sonarr.length) && (
            <List.Item
              title={intl.formatMessage(messages.services)}
              className="flex flex-col space-y-1 sm:space-y-2"
            >
              {services?.radarr.length > 0 && (
                <div className="flex flex-row flex-wrap">
                  {services.radarr.map((radarr, i) => (
                    <span
                      key={`radarr-server-${i}`}
                      className="flex items-center mr-6 flex-nowrap whitespace-nowrap"
                    >
                      {radarr.connected ? <CheckBadge /> : <XBadge />}
                      {radarr.url ? (
                        <a
                          href={radarr.url}
                          target="_blank"
                          rel="noreferrer"
                          className="transition duration-300 hover:underline"
                        >
                          {radarr.name}
                        </a>
                      ) : (
                        radarr.name
                      )}
                    </span>
                  ))}
                </div>
              )}
              {services?.sonarr.length > 0 && (
                <div className="flex flex-row flex-wrap">
                  {services.sonarr.map((sonarr, i) => (
                    <span
                      key={`sonarr-server-${i}`}
                      className="flex items-center mr-6 flex-nowrap whitespace-nowrap"
                    >
                      {sonarr.connected ? <CheckBadge /> : <XBadge />}
                      {sonarr.url ? (
                        <a
                          href={sonarr.url}
                          target="_blank"
                          rel="noreferrer"
                          className="transition duration-300 hover:underline"
                        >
                          {sonarr.name}
                        </a>
                      ) : (
                        sonarr.name
                      )}
                    </span>
                  ))}
                </div>
              )}
            </List.Item>
          )}
        </List>
      </div>
      <div className="section">
        <List title={intl.formatMessage(messages.gettingsupport)}>
          <List.Item title={intl.formatMessage(messages.documentation)}>
            <a
              href="https://docs.overseerr.dev"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-500 transition duration-300 hover:underline"
            >
              https://docs.overseerr.dev
            </a>
          </List.Item>
          <List.Item title={intl.formatMessage(messages.githubdiscussions)}>
            <a
              href="https://github.com/sct/overseerr/discussions"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-500 transition duration-300 hover:underline"
            >
              https://github.com/sct/overseerr/discussions
            </a>
          </List.Item>
          <List.Item title="Discord">
            <a
              href="https://discord.gg/PkCWJSeCk7"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-500 transition duration-300 hover:underline"
            >
              https://discord.gg/PkCWJSeCk7
            </a>
          </List.Item>
        </List>
      </div>
      <div className="section">
        <List title={intl.formatMessage(messages.supportoverseerr)}>
          <List.Item
            title={`${intl.formatMessage(messages.helppaycoffee)} ☕️`}
          >
            <a
              href="https://github.com/sponsors/sct"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-500 transition duration-300 hover:underline"
            >
              https://github.com/sponsors/sct
            </a>
            <Badge className="ml-2">
              {intl.formatMessage(messages.preferredmethod)}
            </Badge>
          </List.Item>
          <List.Item title="">
            <a
              href="https://patreon.com/overseerr"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-500 transition duration-300 hover:underline"
            >
              https://patreon.com/overseerr
            </a>
          </List.Item>
        </List>
      </div>
      <div className="section">
        <Releases currentVersion={data.version} />
      </div>
    </>
  );
};

export default SettingsAbout;
