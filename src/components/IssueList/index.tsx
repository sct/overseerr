import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FilterIcon,
  SortDescendingIcon,
} from '@heroicons/react/solid';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';
import { IssueResultsResponse } from '../../../server/interfaces/api/issueInterfaces';
import Button from '../../components/Common/Button';
import { useUpdateQueryParams } from '../../hooks/useUpdateQueryParams';
import globalMessages from '../../i18n/globalMessages';
import Header from '../Common/Header';
import LoadingSpinner from '../Common/LoadingSpinner';
import PageTitle from '../Common/PageTitle';
import IssueItem from './IssueItem';

const messages = defineMessages({
  issues: 'Issues',
  sortAdded: 'Request Date',
  sortModified: 'Last Modified',
  showallissues: 'Show All Issues',
});

enum Filter {
  ALL = 'all',
  OPEN = 'open',
  RESOLVED = 'resolved',
}

type Sort = 'added' | 'modified';

const IssueList: React.FC = () => {
  const intl = useIntl();
  const router = useRouter();
  const [currentFilter, setCurrentFilter] = useState<Filter>(Filter.OPEN);
  const [currentSort, setCurrentSort] = useState<Sort>('added');
  const [currentPageSize, setCurrentPageSize] = useState<number>(10);

  const page = router.query.page ? Number(router.query.page) : 1;
  const pageIndex = page - 1;
  const updateQueryParams = useUpdateQueryParams({ page: page.toString() });

  const { data, error } = useSWR<IssueResultsResponse>(
    `/api/v1/issue?take=${currentPageSize}&skip=${
      pageIndex * currentPageSize
    }&filter=${currentFilter}&sort=${currentSort}`
  );

  // Restore last set filter values on component mount
  useEffect(() => {
    const filterString = window.localStorage.getItem('il-filter-settings');

    if (filterString) {
      const filterSettings = JSON.parse(filterString);

      setCurrentFilter(filterSettings.currentFilter);
      setCurrentSort(filterSettings.currentSort);
      setCurrentPageSize(filterSettings.currentPageSize);
    }

    // If filter value is provided in query, use that instead
    if (Object.values(Filter).includes(router.query.filter as Filter)) {
      setCurrentFilter(router.query.filter as Filter);
    }
  }, [router.query.filter]);

  // Set filter values to local storage any time they are changed
  useEffect(() => {
    window.localStorage.setItem(
      'il-filter-settings',
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
      <PageTitle title={intl.formatMessage(messages.issues)} />
      <div className="flex flex-col justify-between mb-4 lg:items-end lg:flex-row">
        <Header>{intl.formatMessage(messages.issues)}</Header>
        <div className="flex flex-col flex-grow mt-2 sm:flex-row lg:flex-grow-0">
          <div className="flex flex-grow mb-2 sm:mb-0 sm:mr-2 lg:flex-grow-0">
            <span className="inline-flex items-center px-3 text-sm text-gray-100 bg-gray-800 border border-r-0 border-gray-500 cursor-default rounded-l-md">
              <FilterIcon className="w-6 h-6" />
            </span>
            <select
              id="filter"
              name="filter"
              onChange={(e) => {
                setCurrentFilter(e.target.value as Filter);
                router.push({
                  pathname: router.pathname,
                  query: router.query.userId
                    ? { userId: router.query.userId }
                    : {},
                });
              }}
              value={currentFilter}
              className="rounded-r-only"
            >
              <option value="all">
                {intl.formatMessage(globalMessages.all)}
              </option>
              <option value="open">
                {intl.formatMessage(globalMessages.open)}
              </option>
              <option value="resolved">
                {intl.formatMessage(globalMessages.resolved)}
              </option>
            </select>
          </div>
          <div className="flex flex-grow mb-2 sm:mb-0 lg:flex-grow-0">
            <span className="inline-flex items-center px-3 text-gray-100 bg-gray-800 border border-r-0 border-gray-500 cursor-default sm:text-sm rounded-l-md">
              <SortDescendingIcon className="w-6 h-6" />
            </span>
            <select
              id="sort"
              name="sort"
              onChange={(e) => {
                setCurrentSort(e.target.value as Sort);
                router.push({
                  pathname: router.pathname,
                  query: router.query.userId
                    ? { userId: router.query.userId }
                    : {},
                });
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
      {data.results.map((issue) => {
        return (
          <div className="py-2" key={`issue-item-${issue.id}`}>
            <IssueItem issue={issue} />
          </div>
        );
      })}
      {data.results.length === 0 && (
        <div className="flex flex-col items-center justify-center w-full py-24 text-white">
          <span className="text-2xl text-gray-400">
            {intl.formatMessage(globalMessages.noresults)}
          </span>
          {currentFilter !== Filter.ALL && (
            <div className="mt-4">
              <Button
                buttonType="primary"
                onClick={() => setCurrentFilter(Filter.ALL)}
              >
                {intl.formatMessage(messages.showallissues)}
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
                        .push({
                          pathname: router.pathname,
                          query: router.query.userId
                            ? { userId: router.query.userId }
                            : {},
                        })
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
              onClick={() => updateQueryParams('page', (page - 1).toString())}
            >
              <ChevronLeftIcon />
              <span>{intl.formatMessage(globalMessages.previous)}</span>
            </Button>
            <Button
              disabled={!hasNextPage}
              onClick={() => updateQueryParams('page', (page + 1).toString())}
            >
              <span>{intl.formatMessage(globalMessages.next)}</span>
              <ChevronRightIcon />
            </Button>
          </div>
        </nav>
      </div>
    </>
  );
};

export default IssueList;
