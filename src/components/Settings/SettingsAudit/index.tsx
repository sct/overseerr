import Button from '@app/components/Common/Button';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import Table from '@app/components/Common/Table';
import useDebouncedState from '@app/hooks/useDebouncedState';
import { useUpdateQueryParams } from '@app/hooks/useUpdateQueryParams';
import globalMessages from '@app/i18n/globalMessages';
import Error from '@app/pages/_error';
import { ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import type { AuditLogResultsResponse } from '@server/interfaces/api/auditInterfaces';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages({
  audit: 'Audit Log',
  auditDescription: 'Tracks administrative actions (requests, settings changes, etc.).',
  searchPlaceholder: 'Search',
  time: 'Timestamp',
  user: 'User',
  action: 'Action',
  entity: 'Entity',
  ip: 'IP',
});

const SettingsAudit = () => {
  const router = useRouter();
  const intl = useIntl();
  const [currentPageSize, setCurrentPageSize] = useState(25);
  const [searchFilter, debouncedSearchFilter, setSearchFilter] =
    useDebouncedState('');

  const page = router.query.page ? Number(router.query.page) : 1;
  const pageIndex = page - 1;
  const updateQueryParams = useUpdateQueryParams({ page: page.toString() });

  const { data, error } = useSWR<AuditLogResultsResponse>(
    `/api/v1/settings/audit?take=${currentPageSize}&skip=${
      pageIndex * currentPageSize
    }${debouncedSearchFilter ? `&search=${debouncedSearchFilter}` : ''}`
  );

  useEffect(() => {
    const filterString = window.localStorage.getItem('audit-display-settings');
    if (filterString) {
      const filterSettings = JSON.parse(filterString);
      setCurrentPageSize(filterSettings.currentPageSize ?? 25);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      'audit-display-settings',
      JSON.stringify({
        currentPageSize,
      })
    );
  }, [currentPageSize]);

  if (!data && error) {
    return <Error statusCode={500} />;
  }

  const hasNextPage = (data?.pageInfo.pages ?? 0) > pageIndex + 1;
  const hasPrevPage = pageIndex > 0;

  return (
    <>
      <PageTitle
        title={[
          intl.formatMessage(messages.audit),
          intl.formatMessage(globalMessages.settings),
        ]}
      />
      <div className="mb-6">
        <h3 className="heading">{intl.formatMessage(messages.audit)}</h3>
        <p className="description">{intl.formatMessage(messages.auditDescription)}</p>
      </div>

      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1">
          <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-gray-500 bg-gray-800 px-3 text-gray-100 sm:text-sm">
            <MagnifyingGlassIcon className="h-6 w-6" />
          </span>
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder={intl.formatMessage(messages.searchPlaceholder)}
            className="rounded-r-only"
          />
        </div>

        <div className="flex items-center justify-start sm:justify-end">
          <span className="items-center truncate text-sm">
            {intl.formatMessage(globalMessages.resultsperpage, {
              pageSize: (
                <select
                  id="pageSize"
                  name="pageSize"
                  onChange={(e) => {
                    setCurrentPageSize(Number(e.target.value));
                    router
                      .push({ pathname: router.pathname, query: {} })
                      .then(() => window.scrollTo(0, 0));
                  }}
                  value={currentPageSize}
                  className="short inline"
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
      </div>

      {!data ? (
        <LoadingSpinner />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Table.TH>{intl.formatMessage(messages.time)}</Table.TH>
                <Table.TH>{intl.formatMessage(messages.user)}</Table.TH>
                <Table.TH>{intl.formatMessage(messages.action)}</Table.TH>
                <Table.TH>{intl.formatMessage(messages.entity)}</Table.TH>
                <Table.TH>{intl.formatMessage(messages.ip)}</Table.TH>
              </tr>
            </thead>
            <Table.TBody>
              {data.results.map((row) => (
                <tr key={`audit-${row.id}`}>
                  <Table.TD className="whitespace-nowrap text-gray-300">
                    {intl.formatDate(row.createdAt, {
                      year: 'numeric',
                      month: 'short',
                      day: '2-digit',
                      hour: 'numeric',
                      minute: 'numeric',
                      second: 'numeric',
                    })}
                  </Table.TD>
                  <Table.TD className="min-w-[10rem]">
                    {row.user ? (
                      <div className="flex items-center">
                        <img
                          src={row.user.avatar}
                          alt=""
                          className="avatar-sm mr-2 object-cover"
                        />
                        <span className="truncate">{row.user.displayName}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </Table.TD>
                  <Table.TD className="font-mono text-gray-200">
                    {row.action}
                  </Table.TD>
                  <Table.TD className="text-gray-300">
                    {row.entityType ? (
                      <span>
                        {row.entityType}
                        {row.entityId ? `#${row.entityId}` : ''}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </Table.TD>
                  <Table.TD className="text-gray-300">
                    {row.ip || <span className="text-gray-400">—</span>}
                  </Table.TD>
                </tr>
              ))}
            </Table.TBody>
          </Table>

          <div className="actions">
            <nav
              className="mb-3 flex flex-col items-center space-y-3 sm:flex-row sm:space-y-0"
              aria-label="Pagination"
            >
              <div className="flex flex-auto justify-center space-x-2 sm:flex-1 sm:justify-end">
                <Button
                  disabled={!hasPrevPage}
                  onClick={() => updateQueryParams('page', (page - 1).toString())}
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                  <span>{intl.formatMessage(globalMessages.previous)}</span>
                </Button>
                <Button
                  disabled={!hasNextPage}
                  onClick={() => updateQueryParams('page', (page + 1).toString())}
                >
                  <span>{intl.formatMessage(globalMessages.next)}</span>
                  <ChevronRightIcon className="h-5 w-5" />
                </Button>
              </div>
            </nav>
          </div>
        </>
      )}
    </>
  );
};

export default SettingsAudit;

