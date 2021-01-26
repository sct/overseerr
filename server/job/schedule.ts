import schedule from 'node-schedule';
import { jobPlexFullSync, jobPlexRecentSync } from './plexsync';
import logger from '../logger';
import { jobRadarrSync } from './radarrsync';
import { jobSonarrSync } from './sonarrsync';
import downloadTracker from '../lib/downloadtracker';

interface ScheduledJob {
  id: string;
  job: schedule.Job;
  name: string;
}

export const scheduledJobs: ScheduledJob[] = [];

export const startJobs = (): void => {
  // Run recently added plex sync every 5 minutes
  scheduledJobs.push({
    id: 'plex-recently-added-sync',
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
    id: 'plex-full-sync',
    name: 'Plex Full Library Sync',
    job: schedule.scheduleJob('0 0 3 * * *', () => {
      logger.info('Starting scheduled job: Plex Full Sync', { label: 'Jobs' });
      jobPlexFullSync.run();
    }),
  });

  // Run full radarr sync every 24 hours
  scheduledJobs.push({
    id: 'radarr-sync',
    name: 'Radarr Sync',
    job: schedule.scheduleJob('0 0 4 * * *', () => {
      logger.info('Starting scheduled job: Radarr Sync', { label: 'Jobs' });
      jobRadarrSync.run();
    }),
  });

  // Run full sonarr sync every 24 hours
  scheduledJobs.push({
    id: 'sonarr-sync',
    name: 'Sonarr Sync',
    job: schedule.scheduleJob('0 30 4 * * *', () => {
      logger.info('Starting scheduled job: Sonarr Sync', { label: 'Jobs' });
      jobSonarrSync.run();
    }),
  });

  // Run download sync
  scheduledJobs.push({
    id: 'download-sync',
    name: 'Download Sync',
    job: schedule.scheduleJob('0 * * * * *', () => {
      logger.debug('Starting scheduled job: Download Sync', { label: 'Jobs' });
      downloadTracker.updateDownloads();
    }),
  });

  // Reset download sync
  scheduledJobs.push({
    id: 'download-sync-reset',
    name: 'Download Sync Reset',
    job: schedule.scheduleJob('0 0 1 * * *', () => {
      logger.info('Starting scheduled job: Download Sync Reset', {
        label: 'Jobs',
      });
      downloadTracker.resetDownloadTracker();
    }),
  });

  logger.info('Scheduled jobs loaded', { label: 'Jobs' });
};
