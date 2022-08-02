import { uniqWith } from 'lodash';
import RadarrAPI, { RadarrMovie } from '../../../api/servarr/radarr';
import { getSettings, RadarrSettings } from '../../settings';
import BaseScanner, { RunnableScanner, StatusBase } from '../baseScanner';

type SyncStatus = StatusBase & {
  currentServer: RadarrSettings;
  servers: RadarrSettings[];
};

class RadarrScanner
  extends BaseScanner<RadarrMovie>
  implements RunnableScanner<SyncStatus>
{
  private servers: RadarrSettings[];
  private currentServer: RadarrSettings;
  private radarrApi: RadarrAPI;

  constructor() {
    super('Radarr Scan', { bundleSize: 50 });
  }

  public status(): SyncStatus {
    return {
      running: this.running,
      progress: this.progress,
      total: this.items.length,
      currentServer: this.currentServer,
      servers: this.servers,
    };
  }

  public async run(): Promise<void> {
    const settings = getSettings();
    const sessionId = this.startRun();

    try {
      this.servers = uniqWith(settings.radarr, (radarrA, radarrB) => {
        return (
          radarrA.hostname === radarrB.hostname &&
          radarrA.port === radarrB.port &&
          radarrA.baseUrl === radarrB.baseUrl
        );
      });

      for (const server of this.servers) {
        this.currentServer = server;
        if (server.syncEnabled) {
          this.log(
            `Beginning to process Radarr server: ${server.name}`,
            'info'
          );

          this.radarrApi = new RadarrAPI({
            apiKey: server.apiKey,
            url: RadarrAPI.buildUrl(server, '/api/v3'),
          });

          this.items = await this.radarrApi.getMovies();

          await this.loop(this.processRadarrMovie.bind(this), { sessionId });
        } else {
          this.log(`Sync not enabled. Skipping Radarr server: ${server.name}`);
        }
      }

      this.log('Radarr scan complete', 'info');
    } catch (e) {
      this.log('Scan interrupted', 'error', { errorMessage: e.message });
    } finally {
      this.endRun(sessionId);
    }
  }

  private async processRadarrMovie(radarrMovie: RadarrMovie): Promise<void> {
    if (!radarrMovie.monitored && !radarrMovie.hasFile) {
      this.log(
        'Title is unmonitored and has not been downloaded. Skipping item.',
        'debug',
        {
          title: radarrMovie.title,
        }
      );
      return;
    }

    try {
      const server4k = this.enable4kMovie && this.currentServer.is4k;
      await this.processMovie(radarrMovie.tmdbId, {
        is4k: server4k,
        serviceId: this.currentServer.id,
        externalServiceId: radarrMovie.id,
        externalServiceSlug: radarrMovie.titleSlug,
        title: radarrMovie.title,
        processing: !radarrMovie.hasFile,
      });
    } catch (e) {
      this.log('Failed to process Radarr media', 'error', {
        errorMessage: e.message,
        title: radarrMovie.title,
      });
    }
  }
}

export const radarrScanner = new RadarrScanner();
