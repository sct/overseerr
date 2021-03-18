import React, { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';
import {
  LogMessage,
  LogsResultsResponse,
} from '../../../../server/interfaces/api/settingsInterfaces';
import Error from '../../../pages/_error';
import Badge from '../../Common/Badge';
import Button from '../../Common/Button';
import LoadingSpinner from '../../Common/LoadingSpinner';
import PageTitle from '../../Common/PageTitle';
import Table from '../../Common/Table';
import globalMessages from '../../../i18n/globalMessages';

const messages = defineMessages({
  logs: 'Logs',
  logsDescription:
    'You can also view these logs directly via <code>stdout</code>, or in <code>{configDir}/logs/overseerr.log</code>.',
  time: 'Timestamp',
  level: 'Severity',
  label: 'Label',
  message: 'Message',
  filterDebug: 'Debug',
  filterInfo: 'Info',
  filterWarn: 'Warning',
  filterError: 'Error',
  noresults: 'No results.',
  showall: 'Show All Logs',
  showingresults:
    'Showing <strong>{from}</strong> to <strong>{to}</strong> of <strong>{total}</strong> results',
  resultsperpage: 'Display {pageSize} results per page',
  next: 'Next',
  previous: 'Previous',
  pauseLogs: 'Pause',
  resumeLogs: 'Resume',
});

type Filter = 'debug' | 'info' | 'warn' | 'error';

const SettingsLogs: React.FC = () => {
  const intl = useIntl();
  const [pageIndex, setPageIndex] = useState(0);
  const [currentFilter, setCurrentFilter] = useState<Filter>('debug');
  const [currentPageSize, setCurrentPageSize] = useState(25);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  const toggleLogs = () => {
    setRefreshInterval(refreshInterval === 5000 ? 0 : 5000);
  };

  const { data, error } = useSWR<LogsResultsResponse>(
    `/api/v1/settings/logs?take=${currentPageSize}&skip=${
      pageIndex * currentPageSize
    }&filter=${currentFilter}`,
    {
      refreshInterval: refreshInterval,
      revalidateOnFocus: false,
    }
  );

  const { data: appData } = useSWR('/api/v1/status/appdata');

  useEffect(() => {
    const displayString = window.localStorage.getItem('logs-display-settings');

    if (displayString) {
      const displaySettings = JSON.parse(displayString);

      setCurrentFilter(displaySettings.currentFilter);
      setCurrentPageSize(displaySettings.currentPageSize);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      'logs-display-settings',
      JSON.stringify({
        currentFilter,
        currentPageSize,
      })
    );
  }, [currentFilter, currentPageSize]);

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <Error statusCode={500} />;
  }

  const hasNextPage = data.pageInfo.pages > pageIndex + 1;
  const hasPrevPage = pageIndex > 0;

  return (
    <>
      <PageTitle
        title={[
          intl.formatMessage(messages.logs),
          intl.formatMessage(globalMessages.settings),
        ]}
      />
      <div className="mb-2">
        <h3 className="heading">{intl.formatMessage(messages.logs)}</h3>
        <p className="description">
          {intl.formatMessage(messages.logsDescription, {
            code: function code(msg) {
              return <code className="bg-opacity-50">{msg}</code>;
            },
            configDir: appData ? appData.appDataPath : '/app/config',
          })}
        </p>
        <div className="flex flex-row flex-grow mt-2 sm:flex-grow-0 sm:justify-end">
          <div className="flex flex-row justify-between flex-1 mb-2 sm:mb-0 sm:flex-none">
            <Button
              className="flex-grow w-full mr-2 sm:w-24"
              buttonType={refreshInterval ? 'default' : 'primary'}
              onClick={() => toggleLogs()}
            >
              {intl.formatMessage(
                refreshInterval ? messages.pauseLogs : messages.resumeLogs
              )}
            </Button>
          </div>
          <div className="flex flex-1 mb-2 sm:mb-0 sm:flex-none">
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
                setPageIndex(0);
                setCurrentFilter(e.target.value as Filter);
              }}
              value={currentFilter}
              className="rounded-r-only"
            >
              <option value="debug">
                {intl.formatMessage(messages.filterDebug)}
              </option>
              <option value="info">
                {intl.formatMessage(messages.filterInfo)}
              </option>
              <option value="warn">
                {intl.formatMessage(messages.filterWarn)}
              </option>
              <option value="error">
                {intl.formatMessage(messages.filterError)}
              </option>
            </select>
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
            {data.results.map((row: LogMessage, index: number) => {
              return (
                <tr key={`log-list-${index}`}>
                  <Table.TD className="text-gray-300">
                    {intl.formatDate(row.timestamp, {
                      year: 'numeric',
                      month: 'short',
                      day: '2-digit',
                      hour: 'numeric',
                      minute: 'numeric',
                      second: 'numeric',
                      hour12: false,
                    })}
                  </Table.TD>
                  <Table.TD className="text-gray-300">
                    <Badge
                      badgeType={
                        row.level === 'error'
                          ? 'danger'
                          : row.level === 'warn'
                          ? 'warning'
                          : row.level === 'info'
                          ? 'success'
                          : 'default'
                      }
                    >
                      {row.level.toUpperCase()}
                    </Badge>
                  </Table.TD>
                  <Table.TD className="text-gray-300">{row.label}</Table.TD>
                  <Table.TD className="text-gray-300">{row.message}</Table.TD>
                </tr>
              );
            })}

            {data.results.length === 0 && (
              <tr className="relative h-24 p-2 text-white">
                <Table.TD colSpan={4} noPadding>
                  <div className="flex flex-col items-center justify-center w-screen p-6 lg:w-full">
                    <span className="text-base">
                      {intl.formatMessage(messages.noresults)}
                    </span>
                    {currentFilter !== 'debug' && (
                      <div className="mt-4">
                        <Button
                          buttonSize="sm"
                          buttonType="primary"
                          onClick={() => setCurrentFilter('debug')}
                        >
                          {intl.formatMessage(messages.showall)}
                        </Button>
                      </div>
                    )}
                  </div>
                </Table.TD>
              </tr>
            )}
            <tr className="bg-gray-700">
              <Table.TD colSpan={6} noPadding>
                <nav
                  className="flex flex-col items-center w-screen px-6 py-3 space-x-4 space-y-3 sm:space-y-0 sm:flex-row lg:w-full"
                  aria-label="Pagination"
                >
                  <div className="hidden lg:flex lg:flex-1">
                    <p className="text-sm">
                      {data.results.length > 0 &&
                        intl.formatMessage(messages.showingresults, {
                          from: pageIndex * currentPageSize + 1,
                          to:
                            data.results.length < currentPageSize
                              ? pageIndex * currentPageSize +
                                data.results.length
                              : (pageIndex + 1) * currentPageSize,
                          total: data.pageInfo.results,
                          strong: function strong(msg) {
                            return <span className="font-medium">{msg}</span>;
                          },
                        })}
                    </p>
                  </div>
                  <div className="flex justify-center sm:flex-1 sm:justify-start lg:justify-center">
                    <span className="items-center -mt-3 text-sm sm:-ml-4 lg:ml-0 sm:mt-0">
                      {intl.formatMessage(messages.resultsperpage, {
                        pageSize: (
                          <select
                            id="pageSize"
                            name="pageSize"
                            onChange={(e) => {
                              setPageIndex(0);
                              setCurrentPageSize(Number(e.target.value));
                            }}
                            value={currentPageSize}
                            className="inline short"
                          >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                          </select>
                        ),
                      })}
                    </span>
                  </div>
                  <div className="flex justify-center flex-auto space-x-2 sm:justify-end sm:flex-1">
                    <Button
                      disabled={!hasPrevPage}
                      onClick={() => setPageIndex((current) => current - 1)}
                    >
                      {intl.formatMessage(messages.previous)}
                    </Button>
                    <Button
                      disabled={!hasNextPage}
                      onClick={() => setPageIndex((current) => current + 1)}
                    >
                      {intl.formatMessage(messages.next)}
                    </Button>
                  </div>
                </nav>
              </Table.TD>
            </tr>
          </Table.TBody>
        </Table>
      </div>
    </>
  );
};

export default SettingsLogs;
