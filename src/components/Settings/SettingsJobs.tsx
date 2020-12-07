import React from 'react';
import useSWR from 'swr';
import LoadingSpinner from '../Common/LoadingSpinner';
import { FormattedRelativeTime, defineMessages, useIntl } from 'react-intl';
import Button from '../Common/Button';
import Table from '../Common/Table';

const messages = defineMessages({
  jobname: 'Job Name',
  nextexecution: 'Next Execution',
  runnow: 'Run Now',
});

const SettingsJobs: React.FC = () => {
  const intl = useIntl();
  const { data, error } = useSWR<{ name: string; nextExecutionTime: string }[]>(
    '/api/v1/settings/jobs'
  );

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  return (
    <Table>
      <thead>
        <Table.TH>{intl.formatMessage(messages.jobname)}</Table.TH>
        <Table.TH>{intl.formatMessage(messages.nextexecution)}</Table.TH>
        <Table.TH></Table.TH>
      </thead>
      <Table.TBody>
        {data?.map((job, index) => (
          <tr key={`job-list-${index}`}>
            <Table.TD>
              <div className="text-sm leading-5 text-white">{job.name}</div>
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
              <Button buttonType="primary">
                {intl.formatMessage(messages.runnow)}
              </Button>
            </Table.TD>
          </tr>
        ))}
      </Table.TBody>
    </Table>
  );
};

export default SettingsJobs;
