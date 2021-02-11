import React, { useState } from 'react';
import useSWR from 'swr';
import Error from '../../../pages/_error';
import LoadingSpinner from '../../Common/LoadingSpinner';
import {
  FormattedDate,
  FormattedTime,
  useIntl,
  defineMessages,
} from 'react-intl';
import Table from '../../Common/Table';

const messages = defineMessages({
  logs: 'Logs',
  logsDescription:
    "You can access your logs directly in <code>stdout</code> (container logs) or by looking in <code>'<Overseeerr-install-directory'>/logs/overseerr.log</code>",
  time: 'Time',
  level: 'Level',
  label: 'Label',
  message: 'Message',
  filterAll: 'All',
  filterError: 'Error',
  filterInfo: 'Info',
  filterDebug: 'Debug',
  sortTime: 'Time',
  sortLevel: 'Level',
  sortLabel: 'Label',
});

type Filter = 'all' | 'error' | 'info' | 'debug';
type Sort = 'time' | 'level' | 'label';

const SettingsLogs: React.FC = () => {
  const intl = useIntl();
  // const [pageIndex, setPageIndex] = useState(0);
  const [currentFilter, setCurrentFilter] = useState<Filter>('info');
  const [currentSort, setCurrentSort] = useState<Sort>('time');
  const { data, error } = useSWR(
    `/api/v1/settings/logs?take=100&filter=${currentFilter}&sort=${currentSort}`,
    {
      refreshInterval: 2,
    }
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
      <div className="mb-2">
        <h3 className="heading">{intl.formatMessage(messages.logs)}</h3>
        <div className="flex flex-col justify-between lg:items-end lg:flex-row">
          <p className="description">
            {intl.formatMessage(messages.logsDescription, {
              code: function code(msg) {
                return <code className="bg-opacity-50">{msg}</code>;
              },
            })}
          </p>
          <div className="flex flex-col flex-grow sm:flex-row lg:flex-grow-0">
            <div className="flex flex-grow mb-2 sm:mb-0 sm:mr-2 lg:flex-grow-0">
              <span className="inline-flex items-center px-3 text-sm text-gray-100 bg-gray-800 border border-r-0 border-gray-500 cursor-default rounded-l-md">
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <select
                id="filter"
                name="filter"
                onChange={(e) => {
                  // setPageIndex(0);
                  setCurrentFilter(e.target.value as Filter);
                }}
                value={currentFilter}
                className="rounded-r-only"
              >
                <option value="all">
                  {intl.formatMessage(messages.filterAll)}
                </option>
                <option value="error">
                  {intl.formatMessage(messages.filterError)}
                </option>
                <option value="info">
                  {intl.formatMessage(messages.filterInfo)}
                </option>
                <option value="debug">
                  {intl.formatMessage(messages.filterDebug)}
                </option>
              </select>
            </div>
            <div className="flex flex-grow mb-2 sm:mb-0 lg:flex-grow-0">
              <span className="inline-flex items-center px-3 text-gray-100 bg-gray-800 border border-r-0 border-gray-500 cursor-default sm:text-sm rounded-l-md">
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
                </svg>
              </span>
              <select
                id="sort"
                name="sort"
                onChange={(e) => {
                  // setPageIndex(0);
                  setCurrentSort(e.target.value as Sort);
                }}
                onBlur={(e) => {
                  // setPageIndex(0);
                  setCurrentSort(e.target.value as Sort);
                }}
                value={currentSort}
                className="rounded-r-only"
              >
                <option value="time">
                  {intl.formatMessage(messages.sortTime)}
                </option>
                <option value="level">
                  {intl.formatMessage(messages.sortLevel)}
                </option>
                <option value="label">
                  {intl.formatMessage(messages.sortLabel)}
                </option>
              </select>
            </div>
          </div>
        </div>
        <Table>
          <thead>
            <tr>
              <Table.TH>{intl.formatMessage(messages.time)}</Table.TH>
              <Table.TH>{intl.formatMessage(messages.level)}</Table.TH>
              <Table.TH>{intl.formatMessage(messages.label)}</Table.TH>
              <Table.TH>{intl.formatMessage(messages.message)}</Table.TH>
            </tr>
          </thead>
          <Table.TBody>
            {data?.map(
              (
                row: {
                  timestamp: string;
                  level: string;
                  label: string;
                  message: string;
                },
                index: number
              ) => {
                return (
                  <tr className="" key={`log-list-${index}`}>
                    <Table.TD>
                      <div className="flex items-center py-0 text-gray-300">
                        <FormattedDate
                          value={row.timestamp}
                          year="numeric"
                          month="short"
                          day="2-digit"
                        />
                        <> </>
                        <FormattedTime
                          value={row.timestamp}
                          hour="numeric"
                          minute="numeric"
                          second="numeric"
                          hour12={false}
                        />
                      </div>
                    </Table.TD>
                    <Table.TD>
                      <div className="flex items-center py-0 text-gray-300">
                        {row.level}
                      </div>
                    </Table.TD>
                    <Table.TD>
                      <div className="flex items-center py-0 text-gray-300">
                        {row.label}
                      </div>
                    </Table.TD>
                    <Table.TD>
                      <div className="flex items-center py-0 text-gray-300">
                        {row.message}
                      </div>
                    </Table.TD>
                  </tr>
                );
              }
            )}
          </Table.TBody>
        </Table>
      </div>
      <h3 className="text-lg font-medium leading-6 text-gray-200">
        {intl.formatMessage(messages.logs)}
      </h3>
      <p className="text-sm leading-5 text-gray-500">
        {intl.formatMessage(messages.logsDescription)}
      </p>

      <div className="mt-4 text-sm">
        {data?.map((row: any, index: any) => (
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
    </>
  );
};

export default SettingsLogs;
