import schedule from 'node-schedule';
import { jobPlexFullSync, jobPlexRecentSync } from './plexsync';
import logger from '../logger';

interface ScheduledJob {
  job: schedule.Job;
  name: string;
}

export const scheduledJobs: ScheduledJob[] = [];

export const startJobs = (): void => {
  // Run recently added plex sync every 5 minutes
  scheduledJobs.push({
    name: 'Plex Recently Added Sync',
    job: schedule.scheduleJob('0 */5 * * * *', () => {
      logger.info('Starting scheduled job: Plex Recently Added Sync', {
        label: 'Jobs',
      });
      jobPlexRecentSync.run();
    }),
  });
  // Run full plex sync every 24 hours
  scheduledJobs.push({
    name: 'Plex Full Library Sync',
    job: schedule.scheduleJob('0 0 3 * * *', () => {
      logger.info('Starting scheduled job: Plex Full Sync', { label: 'Jobs' });
      jobPlexFullSync.run();
    }),
  });

  logger.info('Scheduled jobs loaded', { label: 'Jobs' });
};
