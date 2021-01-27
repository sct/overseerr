import React from 'react';
import useSWR from 'swr';
import LoadingSpinner from '../Common/LoadingSpinner';
import { FormattedRelativeTime, defineMessages, useIntl } from 'react-intl';
import Button from '../Common/Button';
import Table from '../Common/Table';
import Spinner from '../../assets/spinner.svg';
import axios from 'axios';
import { useToasts } from 'react-toast-notifications';
import Badge from '../Common/Badge';

const messages = defineMessages({
  jobname: 'Job Name',
  jobtype: 'Type',
  nextexecution: 'Next Execution',
  runnow: 'Run Now',
  canceljob: 'Cancel Job',
  jobstarted: '{jobname} started.',
  jobcancelled: '{jobname} cancelled.',
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

  return (
    <Table>
      <thead>
        <Table.TH>{intl.formatMessage(messages.jobname)}</Table.TH>
        <Table.TH>{intl.formatMessage(messages.jobname)}</Table.TH>
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
  );
};

export default SettingsJobs;
