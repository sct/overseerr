import CalendarItemCard from '@app/components/CalendarList/CalendarItem';
import Button from '@app/components/Common/Button';
import Header from '@app/components/Common/Header';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import { useUpdateQueryParams } from '@app/hooks/useUpdateQueryParams';
import { useUser } from '@app/hooks/useUser';
import globalMessages from '@app/i18n/globalMessages';
import {
  BarsArrowDownIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
} from '@heroicons/react/24/solid';
import type { MediaType } from '@server/constants/media';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';

interface JobSettings {
  id: string;
  name: string;
  type: string;
  interval: string;
  cronSchedule: string;
  nextExecutionTime: string;
  running: boolean;
}

const messages = defineMessages({
  calendar: 'Calendar',
  airingtoday: 'Airing Today',
  thisweek: 'This Week',
  upcoming: 'Upcoming',
  downloaded: 'Downloaded',
  missing: 'Missing',
  processing: 'Processing',
  myshows: 'My Items',
  movies: 'Movies',
  series: 'Series',
  sortAirDate: 'Air Date',
  sortAdded: 'Added Date',
  monthview: 'Month',
  weekview: 'Week',
  forecastview: 'Forecast',
  dayview: 'Day',
  showall: 'All',
});

enum Filter {
  ALL = 'all',
  AIRING_TODAY = 'airing_today',
  THIS_WEEK = 'this_week',
  UPCOMING = 'upcoming',
  DOWNLOADED = 'downloaded',
  MISSING = 'missing',
  PROCESSING = 'processing',
  MY_ITEMS = 'my_items',
  MOVIES = 'movies',
  SERIES = 'series',
}

enum ViewType {
  MONTH = 'month',
  WEEK = 'week',
  FORECAST = 'forecast',
  DAY = 'day',
}

type Sort = 'air_date' | 'added';

interface CalendarListItem {
  id: number;
  title: string;
  seriesTitle?: string;
  overview?: string;
  airDate?: string;
  airDateUtc?: string;
  releaseDate?: string;
  mediaType: MediaType;
  tmdbId?: number;
  tvdbId?: number;
  seriesId?: number;
  seasonNumber?: number;
  episodeNumber?: number;
  hasFile: boolean;
  monitored: boolean;
  source: 'sonarr' | 'radarr';
}

interface CalendarResponse {
  pageInfo: {
    pages: number;
    pageSize: number;
    results: number;
    page: number;
  };
  results: CalendarListItem[];
}

const CalendarList = () => {
  const router = useRouter();
  const intl = useIntl();
  useUser(); // Hook required for permissions
  const [currentFilter, setCurrentFilter] = useState<Filter>(Filter.UPCOMING);
  const [currentSort, setCurrentSort] = useState<Sort>('air_date');
  const [currentPageSize, setCurrentPageSize] = useState<number>(50);
  const [currentView, setCurrentView] = useState<ViewType>(ViewType.WEEK);

  const page = router.query.page ? Number(router.query.page) : 1;
  const pageIndex = page - 1;
  const updateQueryParams = useUpdateQueryParams({ page: page.toString() });

  // Calculate date range based on current view
  const getDateRange = () => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (currentView) {
      case ViewType.DAY:
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 1);
        break;
      case ViewType.WEEK:
        start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 7);
        break;
      case ViewType.MONTH:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case ViewType.FORECAST:
      default:
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 30); // 30 days ahead
        break;
    }

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  };

  const { start, end } = getDateRange();

  // Fetch job settings to get download-sync schedule
  const { data: jobsData } = useSWR<JobSettings[]>('/api/v1/settings/jobs');

  // Find download-sync job - it can only be 30, 45, or 60 seconds
  const downloadSyncJob = jobsData?.find((job) => job.id === 'download-sync');

  // Extract seconds from cron schedule (e.g., "*/30 * * * * *" -> 30 seconds)
  let refreshInterval = 60000; // Default 60 seconds
  if (downloadSyncJob?.cronSchedule) {
    const cronParts = downloadSyncJob.cronSchedule.split(' ');
    if (cronParts[0].includes('*/')) {
      const seconds = parseInt(cronParts[0].replace('*/', ''));
      refreshInterval = seconds * 1000; // Convert to milliseconds
    }
  }

  // Build query string; omit filter when ALL to avoid validator 400
  const query = new URLSearchParams({
    take: String(currentPageSize),
    skip: String(pageIndex * currentPageSize),
    start: start,
    end: end,
  });

  // Optional: target specific services via URL (e.g., /calendar?sonarrId=0)
  if (router.query.sonarrId) {
    query.set('sonarrId', String(router.query.sonarrId));
  }
  if (router.query.radarrId) {
    query.set('radarrId', String(router.query.radarrId));
  }

  if (currentFilter !== Filter.ALL) {
    query.set('filter', currentFilter);
  }

  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR<CalendarResponse>(`/api/v1/calendar?${query.toString()}`, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshInterval: refreshInterval,
  });

  // Restore last set filter values on component mount
  useEffect(() => {
    const filterString = window.localStorage.getItem('cl-filter-settings');

    if (filterString) {
      const filterSettings = JSON.parse(filterString);

      setCurrentFilter(filterSettings.currentFilter || Filter.UPCOMING);
      setCurrentSort(filterSettings.currentSort || 'air_date');
      setCurrentPageSize(filterSettings.currentPageSize || 20);
      setCurrentView(filterSettings.currentView || ViewType.WEEK);
    }

    // If filter value is provided in query, use that instead
    if (Object.values(Filter).includes(router.query.filter as Filter)) {
      setCurrentFilter(router.query.filter as Filter);
    }
    if (Object.values(ViewType).includes(router.query.view as ViewType)) {
      setCurrentView(router.query.view as ViewType);
    }
  }, [router.query.filter, router.query.view]);

  // Set filter values to local storage any time they are changed
  useEffect(() => {
    window.localStorage.setItem(
      'cl-filter-settings',
      JSON.stringify({
        currentFilter,
        currentSort,
        currentPageSize,
        currentView,
      })
    );
  }, [currentFilter, currentSort, currentPageSize, currentView]);

  const isLoading = !data && !error;
  const hasError = !data && !!error;
  const hasNextPage = data ? data.pageInfo.pages > pageIndex + 1 : false;
  const hasPrevPage = pageIndex > 0;

  return (
    <>
      <PageTitle title={[intl.formatMessage(messages.calendar)]} />
      <div
        data-testid="calendar-container"
        className="mb-4 flex flex-col justify-between lg:flex-row lg:items-end"
      >
        <Header>{intl.formatMessage(messages.calendar)}</Header>
        <div className="mt-2 flex flex-grow flex-col sm:flex-row lg:flex-grow-0">
          {/* View Type Tabs */}
          <div className="mb-2 flex flex-grow sm:mb-0 sm:mr-2 lg:flex-grow-0">
            <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-gray-500 bg-gray-800 px-3 text-sm text-gray-100">
              <CalendarDaysIcon className="h-6 w-6" />
            </span>
            <select
              id="view"
              name="view"
              onChange={(e) => {
                setCurrentView(e.target.value as ViewType);
                router.push({
                  pathname: router.pathname,
                  query: { ...router.query, view: e.target.value },
                });
              }}
              value={currentView}
              className="rounded-r-only"
            >
              <option value={ViewType.FORECAST}>
                {intl.formatMessage(messages.forecastview)}
              </option>
              <option value={ViewType.MONTH}>
                {intl.formatMessage(messages.monthview)}
              </option>
              <option value={ViewType.WEEK}>
                {intl.formatMessage(messages.weekview)}
              </option>
              <option value={ViewType.DAY}>
                {intl.formatMessage(messages.dayview)}
              </option>
            </select>
          </div>

          {/* Filter Dropdown */}
          <div className="mb-2 flex flex-grow sm:mb-0 sm:mr-2 lg:flex-grow-0">
            <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-gray-500 bg-gray-800 px-3 text-sm text-gray-100">
              <FunnelIcon className="h-6 w-6" />
            </span>
            <select
              id="filter"
              name="filter"
              onChange={(e) => {
                setCurrentFilter(e.target.value as Filter);
                router.push({
                  pathname: router.pathname,
                  query: { ...router.query, filter: e.target.value },
                });
              }}
              value={currentFilter}
              className="rounded-r-only"
            >
              <option value={Filter.ALL}>
                {intl.formatMessage(messages.showall)}
              </option>
              <option value={Filter.AIRING_TODAY}>
                {intl.formatMessage(messages.airingtoday)}
              </option>
              <option value={Filter.THIS_WEEK}>
                {intl.formatMessage(messages.thisweek)}
              </option>
              <option value={Filter.UPCOMING}>
                {intl.formatMessage(messages.upcoming)}
              </option>
              <option value={Filter.DOWNLOADED}>
                {intl.formatMessage(messages.downloaded)}
              </option>
              <option value={Filter.MISSING}>
                {intl.formatMessage(messages.missing)}
              </option>
              <option value={Filter.PROCESSING}>
                {intl.formatMessage(messages.processing)}
              </option>
              <option value={Filter.MY_ITEMS}>
                {intl.formatMessage(messages.myshows)}
              </option>
              <option value={Filter.MOVIES}>
                {intl.formatMessage(messages.movies)}
              </option>
              <option value={Filter.SERIES}>
                {intl.formatMessage(messages.series)}
              </option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="mb-2 flex flex-grow sm:mb-0 lg:flex-grow-0">
            <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-gray-500 bg-gray-800 px-3 text-gray-100 sm:text-sm">
              <BarsArrowDownIcon className="h-6 w-6" />
            </span>
            <select
              id="sort"
              name="sort"
              onChange={(e) => {
                setCurrentSort(e.target.value as Sort);
                router.push({
                  pathname: router.pathname,
                  query: router.query,
                });
              }}
              value={currentSort}
              className="rounded-r-only"
            >
              <option value="air_date">
                {intl.formatMessage(messages.sortAirDate)}
              </option>
              <option value="added">
                {intl.formatMessage(messages.sortAdded)}
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading / Error / Items */}
      {isLoading && <LoadingSpinner />}
      {hasError && (
        <div className="py-24 text-center text-red-400">
          <p>Failed to load calendar.</p>
          {error && (
            <p className="mt-2 text-xs opacity-60">
              {String(
                (error as unknown as { message?: string })?.message || error
              )}
            </p>
          )}
        </div>
      )}
      {!isLoading && !hasError && data && (
        <>
          {data.results.map((item) => (
            <div
              className="py-2"
              key={`calendar-item-${item.source}-${item.id}`}
              data-testid={`calendar-item-${item.source}-${item.id}`}
            >
              <CalendarItemCard
                item={item}
                revalidateList={() => revalidate()}
                onFileDeleted={() => revalidate()}
              />
            </div>
          ))}

          {data.results.length === 0 && (
            <div className="flex w-full flex-col items-center justify-center py-24 text-white">
              <span className="text-2xl text-gray-400">
                {intl.formatMessage(globalMessages.noresults)}
              </span>
              {currentFilter !== Filter.ALL && (
                <div className="mt-4">
                  <Button
                    buttonType="primary"
                    onClick={() => setCurrentFilter(Filter.ALL)}
                  >
                    {intl.formatMessage(messages.showall)}
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      <div className="actions">
        <nav
          className="mb-3 flex flex-col items-center space-y-3 sm:flex-row sm:space-y-0"
          aria-label="Pagination"
        >
          <div className="hidden lg:flex lg:flex-1">
            <p className="text-sm">
              {data &&
                data.results.length > 0 &&
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
                    onChange={(e) => {
                      setCurrentPageSize(Number(e.target.value));
                      router
                        .push({
                          pathname: router.pathname,
                          query: router.query,
                        })
                        .then(() => window.scrollTo(0, 0));
                    }}
                    value={currentPageSize}
                    className="short inline"
                  >
                    <option value="10">10</option>
                    <option value="20">20</option>
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
    </>
  );
};

export default CalendarList;
