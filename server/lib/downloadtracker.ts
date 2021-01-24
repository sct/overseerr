import { uniqWith } from 'lodash';
import RadarrAPI from '../api/radarr';
import { MediaType } from '../constants/media';
import logger from '../logger';
import { getSettings } from './settings';

export interface DownloadingItem {
  mediaType: MediaType;
  externalId: number;
  size: number;
  sizeLeft: number;
  status: string;
  timeLeft: string;
  estimatedCompletionTime: Date;
  title: string;
}

class DownloadTracker {
  private radarrServers: Record<number, DownloadingItem[]> = {};

  public getMovieProgress(
    serverId: number,
    externalServiceId: number
  ): DownloadingItem[] {
    if (!this.radarrServers[serverId]) {
      return [];
    }

    return this.radarrServers[serverId].filter(
      (item) => item.externalId === externalServiceId
    );
  }

  public async resetDownloadTracker() {
    this.radarrServers = {};
  }

  public async updateDownloads() {
    const settings = getSettings();

    // Remove duplicate servers
    const filteredServers = uniqWith(settings.radarr, (radarrA, radarrB) => {
      return (
        radarrA.hostname === radarrB.hostname &&
        radarrA.port === radarrB.port &&
        radarrA.baseUrl === radarrB.baseUrl
      );
    });

    // Load downloads from Radarr servers
    Promise.all(
      filteredServers.map(async (server) => {
        if (server.syncEnabled) {
          const radarr = new RadarrAPI({
            apiKey: server.apiKey,
            url: RadarrAPI.buildRadarrUrl(server, '/api/v3'),
          });

          const queueItems = await radarr.getQueue();

          this.radarrServers[server.id] = queueItems.map((item) => ({
            externalId: item.movieId,
            estimatedCompletionTime: new Date(item.estimatedCompletionTime),
            mediaType: MediaType.MOVIE,
            size: item.size,
            sizeLeft: item.sizeleft,
            status: item.status,
            timeLeft: item.timeleft,
            title: item.title,
          }));

          if (queueItems.length > 0) {
            logger.debug(
              `Found ${queueItems.length} item(s) in progress on Radarr server: ${server.name}`,
              { label: 'Download Tracker' }
            );
          }

          // Duplicate this data to matching servers
          const matchingServers = settings.radarr.filter(
            (rs) =>
              rs.hostname === server.hostname &&
              rs.port === server.port &&
              rs.baseUrl === server.baseUrl &&
              rs.id !== server.id
          );

          if (matchingServers.length > 0) {
            logger.debug(
              `Matching download data to ${matchingServers.length} other server(s)`,
              { label: 'Download Tracker' }
            );
          }

          matchingServers.forEach((ms) => {
            if (ms.syncEnabled) {
              this.radarrServers[ms.id] = this.radarrServers[server.id];
            }
          });
        }
      })
    );
  }
}

const downloadTracker = new DownloadTracker();

export default downloadTracker;
