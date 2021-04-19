import { PlayIcon, StopIcon, TrashIcon } from '@heroicons/react/outline';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import React, { useState } from 'react';
import {
  defineMessages,
  FormattedRelativeTime,
  MessageDescriptor,
  useIntl,
} from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';
import * as Yup from 'yup';
import { CacheItem } from '../../../../server/interfaces/api/settingsInterfaces';
import Spinner from '../../../assets/spinner.svg';
import globalMessages from '../../../i18n/globalMessages';
import { formatBytes } from '../../../utils/numberHelpers';
import Alert from '../../Common/Alert';
import Badge from '../../Common/Badge';
import Button from '../../Common/Button';
import LoadingSpinner from '../../Common/LoadingSpinner';
import Modal from '../../Common/Modal';
import PageTitle from '../../Common/PageTitle';
import Table from '../../Common/Table';
import Transition from '../../Transition';

const messages: { [messageName: string]: MessageDescriptor } = defineMessages({
  jobsandcache: 'Jobs & Cache',
  jobs: 'Jobs',
  jobsDescription:
    'Overseerr performs certain maintenance tasks as regularly-scheduled jobs, but they can also be manually triggered below. Manually running a job will not alter its schedule.',
  jobname: 'Job Name',
  jobtype: 'Type',
  nextexecution: 'Next Execution',
  runnow: 'Run Now',
  canceljob: 'Cancel Job',
  jobstarted: '{jobname} started.',
  jobcancelled: '{jobname} canceled.',
  process: 'Process',
  command: 'Command',
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
  unknownJob: 'Unknown Job',
  'plex-recently-added-scan': 'Plex Recently Added Scan',
  'plex-full-scan': 'Plex Full Library Scan',
  'radarr-scan': 'Radarr Scan',
  'sonarr-scan': 'Sonarr Scan',
  'download-sync': 'Download Sync',
  'download-sync-reset': 'Download Sync Reset',
  editJobSchedule: 'Modify Job Schedule',
  editJobScheduleDescription:
    'A job schedule can be represented by a CRON expression. Use a tool like <cronhub>crontab.cronhub.io</cronhub> to generate valid CRON expressions.',
  jobScheduleEditSaved: 'Job schedule modified successfully!',
  jobScheduleEditFailed: 'Something went wrong while saving the job schedule',
  editJobSchedulePrompt: 'Enter CRON expression',
  validationJobSchedule: 'You must provide a CRON expression',
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

  const [jobEditModal, setJobEditModal] = useState<{
    isOpen: boolean;
    job?: Job;
  }>({
    isOpen: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  const runJob = async (job: Job) => {
    await axios.post(`/api/v1/settings/jobs/${job.id}/run`);
    addToast(
      intl.formatMessage(messages.jobstarted, {
        jobname: intl.formatMessage(messages[job.id] ?? messages.unknownJob),
      }),
      {
        appearance: 'success',
        autoDismiss: true,
      }
    );
    revalidate();
  };

  const cancelJob = async (job: Job) => {
    await axios.post(`/api/v1/settings/jobs/${job.id}/cancel`);
    addToast(
      intl.formatMessage(messages.jobcancelled, {
        jobname: intl.formatMessage(messages[job.id] ?? messages.unknownJob),
      }),
      {
        appearance: 'error',
        autoDismiss: true,
      }
    );
    revalidate();
  };

  const flushCache = async (cache: CacheItem) => {
    await axios.post(`/api/v1/settings/cache/${cache.id}/flush`);
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
      <PageTitle
        title={[
          intl.formatMessage(messages.jobsandcache),
          intl.formatMessage(globalMessages.settings),
        ]}
      />
      <Transition
        enter="opacity-0 transition duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="opacity-100 transition duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        show={jobEditModal.isOpen}
      >
        <Formik
          initialValues={{
            jobSchedule: '',
          }}
          validationSchema={Yup.object().shape({
            jobSchedule: Yup.string().required(),
          })}
          onSubmit={async (values) => {
            try {
              setIsSaving(true);
              await axios.post(
                `/api/v1/settings/jobs/${jobEditModal.job?.id}/schedule`,
                {
                  ids: jobEditModal.job?.id,
                  schedule: values.jobSchedule,
                }
              );
              addToast(intl.formatMessage(messages.jobScheduleEditSaved), {
                appearance: 'success',
                autoDismiss: true,
              });
              setJobEditModal({ isOpen: false });
            } catch (e) {
              addToast(intl.formatMessage(messages.jobScheduleEditFailed), {
                appearance: 'error',
                autoDismiss: true,
              });
            } finally {
              setIsSaving(false);
            }
          }}
        >
          {({ handleSubmit, isSubmitting, errors, touched }) => {
            return (
              <Modal
                title={intl.formatMessage(messages.editJobSchedule)}
                okText={
                  isSubmitting
                    ? intl.formatMessage(globalMessages.saving)
                    : intl.formatMessage(globalMessages.save)
                }
                iconSvg={
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                }
                onCancel={() => setJobEditModal({ isOpen: false })}
                okDisabled={isSaving}
                onOk={() => handleSubmit()}
              >
                <div className="section">
                  <Alert
                    type="info"
                    title={intl.formatMessage(
                      messages.editJobScheduleDescription,
                      {
                        cronhub: function cronhub(str) {
                          return (
                            <a
                              href="https://crontab.cronhub.io/"
                              className="text-white transition duration-300 hover:underline"
                              target="_blank"
                              rel="noreferrer"
                            >
                              {str}
                            </a>
                          );
                        },
                      }
                    )}
                  ></Alert>
                  <Form>
                    <div className="pb-6 form-row">
                      <label htmlFor="jobSchedule" className="text-label">
                        {intl.formatMessage(messages.editJobSchedulePrompt)}
                      </label>
                      <div className="form-input">
                        <div className="form-input-field">
                          <Field
                            id="jobSchedule"
                            name="jobSchedule"
                            type="text"
                            placeholder="0 */5 * * * *"
                          />
                        </div>
                        {errors.jobSchedule && touched.jobSchedule && (
                          <div className="error">
                            {intl.formatMessage(messages.validationJobSchedule)}
                          </div>
                        )}
                      </div>
                    </div>
                  </Form>
                </div>
              </Modal>
            );
          }}
        </Formik>
      </Transition>

      <div className="mb-6">
        <h3 className="heading">{intl.formatMessage(messages.jobs)}</h3>
        <p className="description">
          {intl.formatMessage(messages.jobsDescription)}
        </p>
      </div>
      <div className="section">
        <Table>
          <thead>
            <tr>
              <Table.TH>{intl.formatMessage(messages.jobname)}</Table.TH>
              <Table.TH>{intl.formatMessage(messages.jobtype)}</Table.TH>
              <Table.TH>{intl.formatMessage(messages.nextexecution)}</Table.TH>
              <Table.TH></Table.TH>
            </tr>
          </thead>
          <Table.TBody>
            {data?.map((job) => (
              <tr key={`job-list-${job.id}`}>
                <Table.TD>
                  <div className="flex items-center text-sm leading-5 text-white">
                    <span>
                      {intl.formatMessage(
                        messages[job.id] ?? messages.unknownJob
                      )}
                    </span>
                    {job.running && <Spinner className="w-5 h-5 ml-2" />}
                  </div>
                </Table.TD>
                <Table.TD>
                  <Badge
                    badgeType={job.type === 'process' ? 'primary' : 'warning'}
                    className="uppercase"
                  >
                    {job.type === 'process'
                      ? intl.formatMessage(messages.process)
                      : intl.formatMessage(messages.command)}
                  </Badge>
                </Table.TD>
                <Table.TD>
                  <div className="text-sm leading-5 text-white">
                    <FormattedRelativeTime
                      value={Math.floor(
                        (new Date(job.nextExecutionTime).getTime() -
                          Date.now()) /
                          1000
                      )}
                      updateIntervalInSeconds={1}
                      numeric="auto"
                    />
                  </div>
                </Table.TD>
                <Table.TD alignText="right">
                  <Button
                    className="mr-2"
                    buttonType="warning"
                    onClick={() => setJobEditModal({ isOpen: true, job: job })}
                  >
                    {intl.formatMessage(globalMessages.edit)}
                  </Button>
                  {job.running ? (
                    <Button buttonType="danger" onClick={() => cancelJob(job)}>
                      <StopIcon />
                      <span>{intl.formatMessage(messages.canceljob)}</span>
                    </Button>
                  ) : (
                    <Button buttonType="primary" onClick={() => runJob(job)}>
                      <PlayIcon className="w-5 h-5 mr-1" />
                      <span>{intl.formatMessage(messages.runnow)}</span>
                    </Button>
                  )}
                </Table.TD>
              </tr>
            ))}
          </Table.TBody>
        </Table>
      </div>
      <div>
        <h3 className="heading">{intl.formatMessage(messages.cache)}</h3>
        <p className="description">
          {intl.formatMessage(messages.cacheDescription)}
        </p>
      </div>
      <div className="section">
        <Table>
          <thead>
            <tr>
              <Table.TH>{intl.formatMessage(messages.cachename)}</Table.TH>
              <Table.TH>{intl.formatMessage(messages.cachehits)}</Table.TH>
              <Table.TH>{intl.formatMessage(messages.cachemisses)}</Table.TH>
              <Table.TH>{intl.formatMessage(messages.cachekeys)}</Table.TH>
              <Table.TH>{intl.formatMessage(messages.cacheksize)}</Table.TH>
              <Table.TH>{intl.formatMessage(messages.cachevsize)}</Table.TH>
              <Table.TH></Table.TH>
            </tr>
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
                    <TrashIcon />
                    <span>{intl.formatMessage(messages.flushcache)}</span>
                  </Button>
                </Table.TD>
              </tr>
            ))}
          </Table.TBody>
        </Table>
      </div>
    </>
  );
};

export default SettingsJobs;
