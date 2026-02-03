import Button from '@app/components/Common/Button';
import ConfirmButton from '@app/components/Common/ConfirmButton';
import Header from '@app/components/Common/Header';
import { RequestItemSkeleton } from '@app/components/Common/LoadingSkeleton';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import KeyboardShortcuts from '@app/components/KeyboardShortcuts';
import RequestItem from '@app/components/RequestList/RequestItem';
import useKeyboardShortcuts from '@app/hooks/useKeyboardShortcuts';
import { useUpdateQueryParams } from '@app/hooks/useUpdateQueryParams';
import { Permission, useUser } from '@app/hooks/useUser';
import globalMessages from '@app/i18n/globalMessages';
import {
  BarsArrowDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/solid';
import type { RequestResultsResponse } from '@server/interfaces/api/requestInterfaces';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR, { mutate } from 'swr';

const messages = defineMessages({
  requests: 'Requests',
  showallrequests: 'Show All Requests',
  sortAdded: 'Most Recent',
  sortModified: 'Last Modified',
  typeFilterAll: 'All Types',
  typeFilterMovies: 'Movies',
  typeFilterTv: 'Series',
  typeFilterMusic: 'Music',
  selected: '{count, plural, one {# selected} other {# selected}}',
  clearSelection: 'Clear',
  bulkApprove: 'Approve',
  bulkDecline: 'Decline',
  bulkDelete: 'Delete',
  bulkDeleteConfirm: 'Confirm Delete',
  exportCsv: 'Export CSV',
  exportFailed: 'Something went wrong while exporting requests.',
  bulkActionFailed: 'Something went wrong while processing bulk actions.',
});

enum Filter {
  ALL = 'all',
  PENDING = 'pending',
  APPROVED = 'approved',
  PROCESSING = 'processing',
  AVAILABLE = 'available',
  UNAVAILABLE = 'unavailable',
  FAILED = 'failed',
  DELETED = 'deleted',
  COMPLETED = 'completed',
}

type Sort = 'added' | 'modified';

type MediaTypeFilter = 'all' | 'movie' | 'tv' | 'music';

const RequestList = () => {
  const router = useRouter();
  const intl = useIntl();
  const { addToast } = useToasts();
  const { user } = useUser({
    id: Number(router.query.userId),
  });
  const { user: currentUser, hasPermission } = useUser();
  const [currentFilter, setCurrentFilter] = useState<Filter>(Filter.PENDING);
  const [currentSort, setCurrentSort] = useState<Sort>('added');
  const [currentTypeFilter, setCurrentTypeFilter] =
    useState<MediaTypeFilter>('all');
  const [currentPageSize, setCurrentPageSize] = useState<number>(10);
  const [selectedRequestIds, setSelectedRequestIds] = useState<number[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const page = router.query.page ? Number(router.query.page) : 1;
  const pageIndex = page - 1;
  const updateQueryParams = useUpdateQueryParams({ page: page.toString() });

  const {
    data,
    error,
    isLoading,
    mutate: revalidate,
  } = useSWR<RequestResultsResponse>(
    `/api/v1/request?take=${currentPageSize}&skip=${
      pageIndex * currentPageSize
    }&filter=${currentFilter}&sort=${currentSort}${
      currentTypeFilter !== 'all' ? `&type=${currentTypeFilter}` : ''
    }${
      router.pathname.startsWith('/profile')
        ? `&requestedBy=${currentUser?.id}`
        : router.query.userId
        ? `&requestedBy=${router.query.userId}`
        : ''
    }`
  );

  // Restore last set filter values on component mount
  useEffect(() => {
    const filterString = window.localStorage.getItem('rl-filter-settings');

    if (filterString) {
      const filterSettings = JSON.parse(filterString);

      setCurrentFilter(filterSettings.currentFilter);
      setCurrentSort(filterSettings.currentSort);
      setCurrentTypeFilter(filterSettings.currentTypeFilter ?? 'all');
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
      'rl-filter-settings',
      JSON.stringify({
        currentFilter,
        currentSort,
        currentTypeFilter,
        currentPageSize,
      })
    );
  }, [currentFilter, currentSort, currentTypeFilter, currentPageSize]);

  const hasNextPage = data?.pageInfo.pages
    ? data.pageInfo.pages > pageIndex + 1
    : false;
  const hasPrevPage = pageIndex > 0;
  const canManageRequests = hasPermission(Permission.MANAGE_REQUESTS);

  const allSelectedOnPage =
    (data?.results.length ?? 0) > 0 &&
    data?.results.every((r) => selectedRequestIds.includes(r.id));

  const setAllOnPageSelected = (selected: boolean) => {
    if (!selected || !data?.results) {
      setSelectedRequestIds([]);
      return;
    }

    setSelectedRequestIds(data.results.map((r) => r.id));
  };

  const updateSelected = (requestId: number, selected: boolean) => {
    setSelectedRequestIds((prev) => {
      if (selected) {
        return prev.includes(requestId) ? prev : [...prev, requestId];
      }
      return prev.filter((id) => id !== requestId);
    });
  };

  const runBulkAction = async (action: 'approve' | 'decline' | 'delete') => {
    if (!selectedRequestIds.length) return;

    setIsBulkProcessing(true);
    try {
      await axios.post('/api/v1/request/bulk', {
        action,
        requestIds: selectedRequestIds,
      });

      setSelectedRequestIds([]);
      await revalidate();
      mutate('/api/v1/request/count');
    } catch (_e) {
      addToast(intl.formatMessage(messages.bulkActionFailed), {
        autoDismiss: true,
        appearance: 'error',
      });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const exportCsv = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      params.set('filter', currentFilter);
      params.set('sort', currentSort);
      if (currentTypeFilter !== 'all') {
        params.set('type', currentTypeFilter);
      }

      const requestedByParam = router.pathname.startsWith('/profile')
        ? currentUser?.id
        : router.query.userId
        ? Number(router.query.userId)
        : undefined;

      if (requestedByParam) {
        params.set('requestedBy', requestedByParam.toString());
      }

      const response = await axios.get(`/api/v1/request/export?${params}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: 'text/csv;charset=utf-8',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `requests-export-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (_e) {
      addToast(intl.formatMessage(messages.exportFailed), {
        autoDismiss: true,
        appearance: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Clear selection when the list context changes (filter/sort/type/page/user)
  useEffect(() => {
    setSelectedRequestIds([]);
  }, [
    currentFilter,
    currentSort,
    currentTypeFilter,
    currentPageSize,
    page,
    router.query.userId,
  ]);

  // Keyboard shortcuts for bulk actions
  useKeyboardShortcuts(
    [
      {
        key: 'a',
        ctrl: true,
        action: () => {
          if (canManageRequests && selectedRequestIds.length > 0) {
            runBulkAction('approve');
          }
        },
        description: 'Approve selected requests',
      },
      {
        key: 'd',
        ctrl: true,
        action: () => {
          if (canManageRequests && selectedRequestIds.length > 0) {
            runBulkAction('decline');
          }
        },
        description: 'Decline selected requests',
      },
      {
        key: 'Delete',
        ctrl: true,
        action: () => {
          if (canManageRequests && selectedRequestIds.length > 0) {
            runBulkAction('delete');
          }
        },
        description: 'Delete selected requests',
      },
      {
        key: '/',
        action: () => {
          const searchInput = document.querySelector(
            'input[type="text"]'
          ) as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
        },
        description: 'Focus search',
      },
    ],
    canManageRequests
  );

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <PageTitle
        title={[
          intl.formatMessage(messages.requests),
          router.query.userId ? user?.displayName : '',
        ]}
      />
      <div className="mb-4 flex flex-col justify-between lg:flex-row lg:items-end">
        <Header
          subtext={
            router.pathname.startsWith('/profile') ? (
              <Link href={`/profile`} legacyBehavior>
                <a className="hover:underline">{currentUser?.displayName}</a>
              </Link>
            ) : router.query.userId ? (
              <Link href={`/users/${user?.id}`} legacyBehavior>
                <a className="hover:underline">{user?.displayName}</a>
              </Link>
            ) : (
              ''
            )
          }
        >
          {intl.formatMessage(messages.requests)}
        </Header>
        <div className="mt-2 flex flex-grow flex-col sm:flex-row lg:flex-grow-0">
          <div className="mb-2 flex flex-grow sm:mb-0 sm:mr-2 lg:flex-grow-0">
            <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-gray-500 bg-gray-800 px-3 text-sm text-gray-100">
              <Squares2X2Icon className="h-6 w-6" />
            </span>
            <select
              id="typeFilter"
              name="typeFilter"
              aria-label="Filter by type"
              onChange={(e) => {
                setCurrentTypeFilter(e.target.value as MediaTypeFilter);
                router.push({
                  pathname: router.pathname,
                  query: router.query.userId
                    ? { userId: router.query.userId }
                    : {},
                });
              }}
              value={currentTypeFilter}
              className="rounded-r-only"
            >
              <option value="all">
                {intl.formatMessage(messages.typeFilterAll)}
              </option>
              <option value="movie">
                {intl.formatMessage(messages.typeFilterMovies)}
              </option>
              <option value="tv">
                {intl.formatMessage(messages.typeFilterTv)}
              </option>
              <option value="music">
                {intl.formatMessage(messages.typeFilterMusic)}
              </option>
            </select>
          </div>
          <div className="mb-2 flex flex-grow sm:mb-0 sm:mr-2 lg:flex-grow-0">
            <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-gray-500 bg-gray-800 px-3 text-sm text-gray-100">
              <FunnelIcon className="h-6 w-6" />
            </span>
            <select
              id="filter"
              name="filter"
              aria-label="Filter requests"
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
              <option value="pending">
                {intl.formatMessage(globalMessages.pending)}
              </option>
              <option value="approved">
                {intl.formatMessage(globalMessages.approved)}
              </option>
              <option value="completed">
                {intl.formatMessage(globalMessages.completed)}
              </option>
              <option value="processing">
                {intl.formatMessage(globalMessages.processing)}
              </option>
              <option value="failed">
                {intl.formatMessage(globalMessages.failed)}
              </option>
              <option value="available">
                {intl.formatMessage(globalMessages.available)}
              </option>
              <option value="unavailable">
                {intl.formatMessage(globalMessages.unavailable)}
              </option>
              <option value="deleted">
                {intl.formatMessage(globalMessages.deleted)}
              </option>
            </select>
          </div>
          <div className="mb-2 flex flex-grow sm:mb-0 lg:flex-grow-0">
            <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-gray-500 bg-gray-800 px-3 text-gray-100 sm:text-sm">
              <BarsArrowDownIcon className="h-6 w-6" />
            </span>
            <select
              id="sort"
              name="sort"
              aria-label="Sort requests"
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
          {canManageRequests && (
            <div className="flex flex-grow sm:ml-2 lg:flex-grow-0">
              <Button
                buttonType="primary"
                className="w-full"
                disabled={isExporting}
                onClick={() => exportCsv()}
              >
                {intl.formatMessage(messages.exportCsv)}
              </Button>
            </div>
          )}
        </div>
      </div>

      {canManageRequests && data.results.length > 0 && (
        <div className="mb-3 flex flex-col justify-between gap-3 rounded-md bg-gray-800/50 p-3 text-gray-100 ring-1 ring-gray-700 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              className="h-4 w-4 cursor-pointer rounded border-gray-500 bg-gray-900 text-indigo-500 focus:ring-indigo-500"
              checked={allSelectedOnPage}
              onChange={(e) => setAllOnPageSelected(e.target.checked)}
              aria-label="Select all requests on this page"
            />
            <span className="text-sm text-gray-300">
              {intl.formatMessage(messages.selected, {
                count: selectedRequestIds.length,
              })}
            </span>
            {selectedRequestIds.length > 0 && (
              <Button
                onClick={() => setSelectedRequestIds([])}
                disabled={isBulkProcessing}
              >
                {intl.formatMessage(messages.clearSelection)}
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              buttonType="success"
              disabled={!selectedRequestIds.length || isBulkProcessing}
              onClick={() => runBulkAction('approve')}
            >
              {intl.formatMessage(messages.bulkApprove)}
            </Button>
            <Button
              buttonType="danger"
              disabled={!selectedRequestIds.length || isBulkProcessing}
              onClick={() => runBulkAction('decline')}
            >
              {intl.formatMessage(messages.bulkDecline)}
            </Button>
            {isBulkProcessing || !selectedRequestIds.length ? (
              <Button buttonType="danger" disabled>
                {intl.formatMessage(messages.bulkDelete)}
              </Button>
            ) : (
              <ConfirmButton
                className="w-full sm:w-auto"
                onClick={() => runBulkAction('delete')}
                confirmText={intl.formatMessage(messages.bulkDeleteConfirm)}
              >
                {intl.formatMessage(messages.bulkDelete)}
              </ConfirmButton>
            )}
          </div>
        </div>
      )}

      {isLoading && !data ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div className="py-2" key={`skeleton-${i}`}>
              <RequestItemSkeleton />
            </div>
          ))}
        </div>
      ) : (
        <>
          {data.results.map((request) => {
            return (
              <div className="py-2" key={`request-list-${request.id}`}>
                <RequestItem
                  request={request}
                  revalidateList={() => revalidate()}
                  showSelection={canManageRequests}
                  selected={selectedRequestIds.includes(request.id)}
                  onSelectedChange={(selected) =>
                    updateSelected(request.id, selected)
                  }
                />
              </div>
            );
          })}

          {data.results.length === 0 && !isLoading && (
            <div className="flex w-full flex-col items-center justify-center py-24 text-white">
              <div className="mb-4 text-6xl text-gray-600">📋</div>
              <span className="mb-2 text-2xl font-semibold text-gray-300">
                {intl.formatMessage(globalMessages.noresults)}
              </span>
              <span className="mb-4 max-w-md text-center text-sm text-gray-400">
                {currentFilter === Filter.PENDING
                  ? 'No pending requests at the moment. All clear!'
                  : currentFilter === Filter.APPROVED
                  ? 'No approved requests found.'
                  : 'No requests match your current filters.'}
              </span>
              {currentFilter !== Filter.ALL && (
                <div className="mt-4">
                  <Button
                    buttonType="primary"
                    onClick={() => setCurrentFilter(Filter.ALL)}
                  >
                    {intl.formatMessage(messages.showallrequests)}
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}
      <div className="actions">
        <nav
          className="mb-3 flex flex-col items-center space-y-3 sm:flex-row sm:space-y-0"
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
                  strong: (msg: React.ReactNode) => (
                    <span className="font-medium">{msg}</span>
                  ),
                })}
            </p>
          </div>
          <div className="flex justify-center sm:flex-1 sm:justify-start lg:justify-center">
            <span className="-mt-3 items-center truncate text-sm sm:mt-0">
              {intl.formatMessage(globalMessages.resultsperpage, {
                pageSize: (
                  <select
                    id="pageSize"
                    name="pageSize"
                    aria-label="Results per page"
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
                    className="short inline"
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
          <div className="flex flex-auto justify-center space-x-2 sm:flex-1 sm:justify-end">
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

      {canManageRequests && (
        <KeyboardShortcuts
          shortcuts={[
            {
              keys: ['Ctrl', 'A'],
              description: intl.formatMessage(messages.bulkApprove),
            },
            {
              keys: ['Ctrl', 'D'],
              description: intl.formatMessage(messages.bulkDecline),
            },
            {
              keys: ['Ctrl', 'Delete'],
              description: intl.formatMessage(messages.bulkDelete),
            },
            {
              keys: ['/'],
              description: 'Focus search',
            },
          ]}
        />
      )}
    </>
  );
};

export default RequestList;
