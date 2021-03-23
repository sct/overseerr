import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';
import type { RequestResultsResponse } from '../../../server/interfaces/api/requestInterfaces';
import globalMessages from '../../i18n/globalMessages';
import Button from '../Common/Button';
import Header from '../Common/Header';
import LoadingSpinner from '../Common/LoadingSpinner';
import PageTitle from '../Common/PageTitle';
import RequestItem from './RequestItem';

const messages = defineMessages({
  requests: 'Requests',
  showallrequests: 'Show All Requests',
  sortAdded: 'Request Date',
  sortModified: 'Last Modified',
});

type Filter = 'all' | 'pending' | 'approved' | 'processing' | 'available';
type Sort = 'added' | 'modified';

const RequestList: React.FC = () => {
  const router = useRouter();
  const intl = useIntl();
  const [currentFilter, setCurrentFilter] = useState<Filter>('pending');
  const [currentSort, setCurrentSort] = useState<Sort>('added');
  const [currentPageSize, setCurrentPageSize] = useState<number>(10);

  const page = router.query.page ? Number(router.query.page) : 1;
  const pageIndex = page - 1;

  const { data, error, revalidate } = useSWR<RequestResultsResponse>(
    `/api/v1/request?take=${currentPageSize}&skip=${
      pageIndex * currentPageSize
    }&filter=${currentFilter}&sort=${currentSort}`
  );

  // Restore last set filter values on component mount
  useEffect(() => {
    const filterString = window.localStorage.getItem('rl-filter-settings');

    if (filterString) {
      const filterSettings = JSON.parse(filterString);

      setCurrentFilter(filterSettings.currentFilter);
      setCurrentSort(filterSettings.currentSort);
      setCurrentPageSize(filterSettings.currentPageSize);
    }
  }, []);

  // Set filter values to local storage any time they are changed
  useEffect(() => {
    window.localStorage.setItem(
      'rl-filter-settings',
      JSON.stringify({
        currentFilter,
        currentSort,
        currentPageSize,
      })
    );
  }, [currentFilter, currentSort, currentPageSize]);

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
      <PageTitle title={intl.formatMessage(messages.requests)} />
      <div className="flex flex-col justify-between mb-4 lg:items-end lg:flex-row">
        <Header>{intl.formatMessage(messages.requests)}</Header>
        <div className="flex flex-col flex-grow mt-2 sm:flex-row lg:flex-grow-0">
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
                setCurrentFilter(e.target.value as Filter);
                router.push(router.pathname);
              }}
              value={currentFilter}
              className="rounded-r-only"
            >
              <option value="all">
                {intl.formatMessage(globalMessages.all)}
              </option>
              <option value="pending">
                {intl.formatMessage(globalMessages.pending)}
              </option>
              <option value="approved">
                {intl.formatMessage(globalMessages.approved)}
              </option>
              <option value="processing">
                {intl.formatMessage(globalMessages.processing)}
              </option>
              <option value="available">
                {intl.formatMessage(globalMessages.available)}
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
                setCurrentSort(e.target.value as Sort);
                router.push(router.pathname);
              }}
              value={currentSort}
              className="rounded-r-only"
            >
              <option value="added">
                {intl.formatMessage(messages.sortAdded)}
              </option>
              <option value="modified">
                {intl.formatMessage(messages.sortModified)}
              </option>
            </select>
          </div>
        </div>
      </div>
      {data.results.map((request) => {
        return (
          <div className="py-2" key={`request-list-${request.id}`}>
            <RequestItem
              request={request}
              revalidateList={() => revalidate()}
            />
          </div>
        );
      })}

      {data.results.length === 0 && (
        <div className="flex flex-col items-center justify-center w-full py-24 text-white">
          <span className="text-2xl text-gray-400">
            {intl.formatMessage(globalMessages.noresults)}
          </span>
          {currentFilter !== 'all' && (
            <div className="mt-4">
              <Button
                buttonType="primary"
                onClick={() => setCurrentFilter('all')}
              >
                {intl.formatMessage(messages.showallrequests)}
              </Button>
            </div>
          )}
        </div>
      )}
      <div className="actions">
        <nav
          className="flex flex-col items-center mb-3 space-y-3 sm:space-y-0 sm:flex-row"
          aria-label="Pagination"
        >
          <div className="hidden lg:flex lg:flex-1">
            <p className="text-sm">
              {data.results.length > 0 &&
                intl.formatMessage(globalMessages.showingresults, {
                  from: pageIndex * currentPageSize + 1,
                  to:
                    data.results.length < currentPageSize
                      ? pageIndex * currentPageSize + data.results.length
                      : (pageIndex + 1) * currentPageSize,
                  total: data.pageInfo.results,
                  strong: function strong(msg) {
                    return <span className="font-medium">{msg}</span>;
                  },
                })}
            </p>
          </div>
          <div className="flex justify-center sm:flex-1 sm:justify-start lg:justify-center">
            <span className="items-center -mt-3 text-sm truncate sm:mt-0">
              {intl.formatMessage(globalMessages.resultsperpage, {
                pageSize: (
                  <select
                    id="pageSize"
                    name="pageSize"
                    onChange={(e) => {
                      setCurrentPageSize(Number(e.target.value));
                      router
                        .push(router.pathname)
                        .then(() => window.scrollTo(0, 0));
                    }}
                    value={currentPageSize}
                    className="inline short"
                  >
                    <option value="5">5</option>
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
              onClick={() =>
                router
                  .push(`${router.pathname}?page=${page - 1}`, undefined, {
                    shallow: true,
                  })
                  .then(() => window.scrollTo(0, 0))
              }
            >
              {intl.formatMessage(globalMessages.previous)}
            </Button>
            <Button
              disabled={!hasNextPage}
              onClick={() =>
                router
                  .push(`${router.pathname}?page=${page + 1}`, undefined, {
                    shallow: true,
                  })
                  .then(() => window.scrollTo(0, 0))
              }
            >
              {intl.formatMessage(globalMessages.next)}
            </Button>
          </div>
        </nav>
      </div>
    </>
  );
};

export default RequestList;
