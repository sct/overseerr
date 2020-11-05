import schedule from 'node-schedule';
import jobPlexSync from './plexsync';
import logger from '../logger';

export const scheduledJobs: Record<string, schedule.Job> = {};

export const startJobs = (): void => {
  // Run full plex sync every 6 hours
  scheduledJobs.plexFullSync = schedule.scheduleJob('* */6 * * *', () => {
    logger.info('Starting scheduled job: Plex Full Sync', { label: 'Jobs' });
    jobPlexSync.run();
  });

  logger.info('Scheduled jobs loaded', { label: 'Jobs' });
};
