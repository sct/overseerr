import React, { useState } from 'react';
import useSWR from 'swr';
import type { RequestResultsResponse } from '../../../server/interfaces/api/requestInterfaces';
import LoadingSpinner from '../Common/LoadingSpinner';
import RequestItem from './RequestItem';
import Header from '../Common/Header';
import Table from '../Common/Table';
import Button from '../Common/Button';

const RequestList: React.FC = () => {
  const [pageIndex, setPageIndex] = useState(0);

  const { data, error } = useSWR<RequestResultsResponse>(
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
      <Header>Requests</Header>
      <Table>
        <thead>
          <Table.TH className="hidden sm:table-cell"></Table.TH>
          <Table.TH>Media Info</Table.TH>
          <Table.TH>Status</Table.TH>
          <Table.TH></Table.TH>
          <Table.TH></Table.TH>
          <Table.TH></Table.TH>
        </thead>
        <Table.TBody>
          {data.results.map((request) => {
            return (
              <RequestItem
                request={request}
                key={`request-list-${request.id}`}
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
                    Showing
                    <span className="font-medium px-1">{pageIndex * 10}</span>
                    to
                    <span className="font-medium px-1">
                      {data.results.length < 10
                        ? pageIndex * 10 + data.results.length
                        : pageIndex + 1 * 10}
                    </span>
                    of
                    <span className="font-medium px-1">
                      {data.pageInfo.results}
                    </span>
                    results
                  </p>
                </div>
                <div className="flex-1 flex justify-start sm:justify-end">
                  <span className="mr-2">
                    <Button
                      disabled={!hasPrevPage}
                      onClick={() => setPageIndex((current) => current - 1)}
                    >
                      Previous
                    </Button>
                  </span>
                  <Button
                    disabled={!hasNextPage}
                    onClick={() => setPageIndex((current) => current + 1)}
                  >
                    Next
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
