import React, { useState } from 'react';
import useSWR from 'swr';
import type { RequestResultsResponse } from '../../../server/interfaces/api/requestInterfaces';
import LoadingSpinner from '../Common/LoadingSpinner';
import RequestItem from './RequestItem';
import Header from '../Common/Header';
import Table from '../Common/Table';
import Button from '../Common/Button';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  requests: 'Requests',
  mediaInfo: 'Media Info',
  status: 'Status',
  requestedAt: 'Requested At',
  modifiedBy: 'Last Modified By',
  showingresults:
    'Showing <strong>{from}</strong> to <strong>{to}</strong> of <strong>{total}</strong> results',
  next: 'Next',
  previous: 'Previous',
});

const RequestList: React.FC = () => {
  const intl = useIntl();
  const [pageIndex, setPageIndex] = useState(0);

  const { data, error, revalidate } = useSWR<RequestResultsResponse>(
    `/api/v1/request?take=10&skip=${pageIndex * 10}`
  );
  if (!data && !error) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <LoadingSpinner />;
  }

  const hasNextPage = data.pageInfo.pages > pageIndex + 1;
  const hasPrevPage = pageIndex > 0;

  return (
    <>
      <Header>{intl.formatMessage(messages.requests)}</Header>
      <Table>
        <thead>
          <Table.TH className="hidden sm:table-cell"></Table.TH>
          <Table.TH>{intl.formatMessage(messages.mediaInfo)}</Table.TH>
          <Table.TH>{intl.formatMessage(messages.status)}</Table.TH>
          <Table.TH>{intl.formatMessage(messages.requestedAt)}</Table.TH>
          <Table.TH>{intl.formatMessage(messages.modifiedBy)}</Table.TH>
          <Table.TH></Table.TH>
        </thead>
        <Table.TBody>
          {data.results.map((request) => {
            return (
              <RequestItem
                request={request}
                key={`request-list-${request.id}`}
                onDelete={() => revalidate()}
              />
            );
          })}
          <tr>
            <Table.TD colSpan={6} noPadding>
              <nav
                className="bg-gray-700 px-4 py-3 flex items-center justify-between text-white sm:px-6"
                aria-label="Pagination"
              >
                <div className="hidden sm:block">
                  <p className="text-sm">
                    {intl.formatMessage(messages.showingresults, {
                      from: pageIndex * 10,
                      to:
                        data.results.length < 10
                          ? pageIndex * 10 + data.results.length
                          : pageIndex + 1 * 10,
                      total: data.pageInfo.results,
                      strong: function strong(msg) {
                        return <span className="font-medium">{msg}</span>;
                      },
                    })}
                  </p>
                </div>
                <div className="flex-1 flex justify-start sm:justify-end">
                  <span className="mr-2">
                    <Button
                      disabled={!hasPrevPage}
                      onClick={() => setPageIndex((current) => current - 1)}
                    >
                      {intl.formatMessage(messages.previous)}
                    </Button>
                  </span>
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
    </>
  );
};

export default RequestList;
