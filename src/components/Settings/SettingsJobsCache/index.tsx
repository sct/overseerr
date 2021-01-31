import React from 'react';
import useSWR from 'swr';
import LoadingSpinner from '../../Common/LoadingSpinner';
import { FormattedRelativeTime, defineMessages, useIntl } from 'react-intl';
import Button from '../../Common/Button';
import Table from '../../Common/Table';
import Spinner from '../../../assets/spinner.svg';
import axios from 'axios';
import { useToasts } from 'react-toast-notifications';
import Badge from '../../Common/Badge';
import { CacheItem } from '../../../../server/interfaces/api/settingsInterfaces';
import { formatBytes } from '../../../utils/numberHelpers';

const messages = defineMessages({
  jobs: 'Jobs',
  jobsDescription:
    'Overseerr performs certain maintenance tasks as regularly-scheduled jobs, but they can also be manually triggered below. Manually running a job will not alter its schedule.',
  jobname: 'Job Name',
  jobtype: 'Type',
  nextexecution: 'Next Execution',
  runnow: 'Run Now',
  canceljob: 'Cancel Job',
  jobstarted: '{jobname} started.',
  jobcancelled: '{jobname} cancelled.',
  cache: 'Cache',
  cacheDescription:
    'Overseerr caches requests to external API endpoints to optimize performance and avoid making unnecessary API calls.',
  cacheflushed: '{cachename} cache flushed.',
  cachename: 'Cache Name',
  cachehits: 'Hits',
  cachemisses: 'Misses',
  cachekeys: 'Total Keys',
  cacheksize: 'Key Size',
  cachevsize: 'Value Size',
  flushcache: 'Flush Cache',
});

interface Job {
  id: string;
  name: string;
  type: 'process' | 'command';
  nextExecutionTime: string;
  running: boolean;
}

const SettingsJobs: React.FC = () => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const { data, error, revalidate } = useSWR<Job[]>('/api/v1/settings/jobs', {
    refreshInterval: 5000,
  });
  const { data: cacheData, revalidate: cacheRevalidate } = useSWR<CacheItem[]>(
    '/api/v1/settings/cache',
    {
      refreshInterval: 10000,
    }
  );

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  const runJob = async (job: Job) => {
    await axios.get(`/api/v1/settings/jobs/${job.id}/run`);
    addToast(
      intl.formatMessage(messages.jobstarted, {
        jobname: job.name,
      }),
      {
        appearance: 'success',
        autoDismiss: true,
      }
    );
    revalidate();
  };

  const cancelJob = async (job: Job) => {
    await axios.get(`/api/v1/settings/jobs/${job.id}/cancel`);
    addToast(intl.formatMessage(messages.jobcancelled, { jobname: job.name }), {
      appearance: 'error',
      autoDismiss: true,
    });
    revalidate();
  };

  const flushCache = async (cache: CacheItem) => {
    await axios.get(`/api/v1/settings/cache/${cache.id}/flush`);
    addToast(
      intl.formatMessage(messages.cacheflushed, { cachename: cache.name }),
      {
        appearance: 'success',
        autoDismiss: true,
      }
    );
    cacheRevalidate();
  };

  return (
    <>
      <div className="mb-4">
        <h3 className="text-lg font-medium leading-6 text-gray-200">
          {intl.formatMessage(messages.jobs)}
        </h3>
        <p className="max-w-2xl mt-1 text-sm leading-5 text-gray-500">
          {intl.formatMessage(messages.jobsDescription)}
        </p>
      </div>
      <Table>
        <thead>
          <Table.TH>{intl.formatMessage(messages.jobname)}</Table.TH>
          <Table.TH>{intl.formatMessage(messages.jobtype)}</Table.TH>
          <Table.TH>{intl.formatMessage(messages.nextexecution)}</Table.TH>
          <Table.TH></Table.TH>
        </thead>
        <Table.TBody>
          {data?.map((job) => (
            <tr key={`job-list-${job.id}`}>
              <Table.TD>
                <div className="flex items-center text-sm leading-5 text-white">
                  {job.running && <Spinner className="w-5 h-5 mr-2" />}
                  <span>{job.name}</span>
                </div>
              </Table.TD>
              <Table.TD>
                <Badge
                  badgeType={job.type === 'process' ? 'primary' : 'warning'}
                  className="uppercase"
                >
                  {job.type}
                </Badge>
              </Table.TD>
              <Table.TD>
                <div className="text-sm leading-5 text-white">
                  <FormattedRelativeTime
                    value={Math.floor(
                      (new Date(job.nextExecutionTime).getTime() - Date.now()) /
                        1000
                    )}
                    updateIntervalInSeconds={1}
                  />
                </div>
              </Table.TD>
              <Table.TD alignText="right">
                {job.running ? (
                  <Button buttonType="danger" onClick={() => cancelJob(job)}>
                    {intl.formatMessage(messages.canceljob)}
                  </Button>
                ) : (
                  <Button buttonType="primary" onClick={() => runJob(job)}>
                    {intl.formatMessage(messages.runnow)}
                  </Button>
                )}
              </Table.TD>
            </tr>
          ))}
        </Table.TBody>
      </Table>
      <div className="my-4">
        <h3 className="text-lg font-medium leading-6 text-gray-200">
          {intl.formatMessage(messages.cache)}
        </h3>
        <p className="max-w-2xl mt-1 text-sm leading-5 text-gray-500">
          {intl.formatMessage(messages.cacheDescription)}
        </p>
      </div>
      <Table>
        <thead>
          <Table.TH>{intl.formatMessage(messages.cachename)}</Table.TH>
          <Table.TH>{intl.formatMessage(messages.cachehits)}</Table.TH>
          <Table.TH>{intl.formatMessage(messages.cachemisses)}</Table.TH>
          <Table.TH>{intl.formatMessage(messages.cachekeys)}</Table.TH>
          <Table.TH>{intl.formatMessage(messages.cacheksize)}</Table.TH>
          <Table.TH>{intl.formatMessage(messages.cachevsize)}</Table.TH>
          <Table.TH></Table.TH>
        </thead>
        <Table.TBody>
          {cacheData?.map((cache) => (
            <tr key={`cache-list-${cache.id}`}>
              <Table.TD>{cache.name}</Table.TD>
              <Table.TD>{intl.formatNumber(cache.stats.hits)}</Table.TD>
              <Table.TD>{intl.formatNumber(cache.stats.misses)}</Table.TD>
              <Table.TD>{intl.formatNumber(cache.stats.keys)}</Table.TD>
              <Table.TD>{formatBytes(cache.stats.ksize)}</Table.TD>
              <Table.TD>{formatBytes(cache.stats.vsize)}</Table.TD>
              <Table.TD alignText="right">
                <Button buttonType="danger" onClick={() => flushCache(cache)}>
                  {intl.formatMessage(messages.flushcache)}
                </Button>
              </Table.TD>
            </tr>
          ))}
        </Table.TBody>
      </Table>
    </>
  );
};

export default SettingsJobs;
