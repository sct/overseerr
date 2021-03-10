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
  type: 'process' | 'command';
  running?: () => boolean;
  cancelFn?: () => void;
}

export const scheduledJobs: ScheduledJob[] = [];

export const startJobs = (): void => {
  // Run recently added plex scan every 5 minutes
  scheduledJobs.push({
    id: 'plex-recently-added-scan',
    name: 'Plex Recently Added Scan',
    type: 'process',
    job: schedule.scheduleJob('0 */5 * * * *', () => {
      logger.info('Starting scheduled job: Plex Recently Added Scan', {
        label: 'Jobs',
      });
      jobPlexRecentSync.run();
    }),
    running: () => jobPlexRecentSync.status().running,
    cancelFn: () => jobPlexRecentSync.cancel(),
  });

  // Run full plex scan every 24 hours
  scheduledJobs.push({
    id: 'plex-full-scan',
    name: 'Plex Full Library Scan',
    type: 'process',
    job: schedule.scheduleJob('0 0 3 * * *', () => {
      logger.info('Starting scheduled job: Plex Full Library Scan', {
        label: 'Jobs',
      });
      jobPlexFullSync.run();
    }),
    running: () => jobPlexFullSync.status().running,
    cancelFn: () => jobPlexFullSync.cancel(),
  });

  // Run full radarr scan every 24 hours
  scheduledJobs.push({
    id: 'radarr-scan',
    name: 'Radarr Scan',
    type: 'process',
    job: schedule.scheduleJob('0 0 4 * * *', () => {
      logger.info('Starting scheduled job: Radarr Scan', { label: 'Jobs' });
      jobRadarrSync.run();
    }),
    running: () => jobRadarrSync.status().running,
    cancelFn: () => jobRadarrSync.cancel(),
  });

  // Run full sonarr scan every 24 hours
  scheduledJobs.push({
    id: 'sonarr-scan',
    name: 'Sonarr Scan',
    type: 'process',
    job: schedule.scheduleJob('0 30 4 * * *', () => {
      logger.info('Starting scheduled job: Sonarr Scan', { label: 'Jobs' });
      jobSonarrSync.run();
    }),
    running: () => jobSonarrSync.status().running,
    cancelFn: () => jobSonarrSync.cancel(),
  });

  // Run download sync
  scheduledJobs.push({
    id: 'download-sync',
    name: 'Download Sync',
    type: 'command',
    job: schedule.scheduleJob('0 * * * * *', () => {
      logger.debug('Starting scheduled job: Download Sync', { label: 'Jobs' });
      downloadTracker.updateDownloads();
    }),
  });

  // Reset download sync
  scheduledJobs.push({
    id: 'download-sync-reset',
    name: 'Download Sync Reset',
    type: 'command',
    job: schedule.scheduleJob('0 0 1 * * *', () => {
      logger.info('Starting scheduled job: Download Sync Reset', {
        label: 'Jobs',
      });
      downloadTracker.resetDownloadTracker();
    }),
  });

  logger.info('Scheduled jobs loaded', { label: 'Jobs' });
};
