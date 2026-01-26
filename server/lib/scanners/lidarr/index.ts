import type { LidarrArtist } from '@server/api/servarr/lidarr';
import LidarrAPI from '@server/api/servarr/lidarr';
import type {
  RunnableScanner,
  StatusBase,
} from '@server/lib/scanners/baseScanner';
import BaseScanner from '@server/lib/scanners/baseScanner';
import { MediaStatus, MediaType } from '@server/constants/media';
import { getRepository } from '@server/datasource';
import Media from '@server/entity/Media';
import type { LidarrSettings } from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';
import { uniqWith } from 'lodash';

type SyncStatus = StatusBase & {
  currentServer: LidarrSettings;
  servers: LidarrSettings[];
};

class LidarrScanner
  extends BaseScanner<LidarrArtist>
  implements RunnableScanner<SyncStatus>
{
  private servers: LidarrSettings[];
  private currentServer: LidarrSettings;
  private lidarrApi: LidarrAPI;

  constructor() {
    super('Lidarr Scan', { bundleSize: 50 });
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
      this.servers = uniqWith(settings.lidarr || [], (lidarrA, lidarrB) => {
        return (
          lidarrA.hostname === lidarrB.hostname &&
          lidarrA.port === lidarrB.port &&
          lidarrA.baseUrl === lidarrB.baseUrl
        );
      });

      for (const server of this.servers) {
        this.currentServer = server;
        if (server.syncEnabled) {
          this.log(
            `Beginning to process Lidarr server: ${server.name}`,
            'info'
          );

          this.lidarrApi = new LidarrAPI({
            apiKey: server.apiKey,
            url: LidarrAPI.buildUrl(server, '/api/v1'),
          });

          this.items = await this.lidarrApi.getArtists();

          await this.loop(this.processLidarrArtist.bind(this), { sessionId });
        } else {
          this.log(`Sync not enabled. Skipping Lidarr server: ${server.name}`);
        }
      }

      this.log('Lidarr scan complete', 'info');
    } catch (e) {
      this.log('Scan interrupted', 'error', { errorMessage: e.message });
    } finally {
      this.endRun(sessionId);
    }
  }

  private async processLidarrArtist(lidarrArtist: LidarrArtist): Promise<void> {
    if (!lidarrArtist.monitored && !lidarrArtist.statistics?.trackFileCount) {
      this.log(
        'Artist is unmonitored and has no tracks. Skipping item.',
        'debug',
        {
          title: lidarrArtist.artistName,
        }
      );
      return;
    }

    try {
      const mediaRepository = getRepository(Media);
      const musicBrainzId = lidarrArtist.foreignArtistId || lidarrArtist.mbId;

      if (!musicBrainzId) {
        this.log('Artist missing MusicBrainz ID. Skipping.', 'debug', {
          title: lidarrArtist.artistName,
        });
        return;
      }

      await this.asyncLock.dispatch(musicBrainzId, async () => {
        const existing = await mediaRepository.findOne({
          where: { musicBrainzId, mediaType: MediaType.ARTIST },
        });

        const hasTracks = (lidarrArtist.statistics?.trackFileCount ?? 0) > 0;
        const processing = !hasTracks && lidarrArtist.monitored;

        if (existing) {
          let changedExisting = false;

          if (
            existing.status !== MediaStatus.AVAILABLE &&
            hasTracks
          ) {
            existing.status = MediaStatus.AVAILABLE;
            changedExisting = true;
          } else if (
            existing.status !== MediaStatus.PROCESSING &&
            processing
          ) {
            existing.status = MediaStatus.PROCESSING;
            changedExisting = true;
          }

          if (
            existing.serviceId !== this.currentServer.id
          ) {
            existing.serviceId = this.currentServer.id;
            changedExisting = true;
          }

          if (
            existing.externalServiceId !== lidarrArtist.id
          ) {
            existing.externalServiceId = lidarrArtist.id;
            changedExisting = true;
          }

          if (
            existing.externalServiceSlug !== lidarrArtist.foreignArtistId
          ) {
            existing.externalServiceSlug = lidarrArtist.foreignArtistId;
            changedExisting = true;
          }

          if (changedExisting) {
            await mediaRepository.save(existing);
            this.log(
              `Media for ${lidarrArtist.artistName} exists. Changes were detected and the artist will be updated.`,
              'info'
            );
          } else {
            this.log(
              `Artist already exists and no changes detected for ${lidarrArtist.artistName}`
            );
          }
        } else {
          const newMedia = new Media();
          newMedia.musicBrainzId = musicBrainzId;
          newMedia.status = hasTracks
            ? MediaStatus.AVAILABLE
            : processing
            ? MediaStatus.PROCESSING
            : MediaStatus.UNKNOWN;
          newMedia.mediaType = MediaType.ARTIST;
          newMedia.serviceId = this.currentServer.id;
          newMedia.externalServiceId = lidarrArtist.id;
          newMedia.externalServiceSlug = lidarrArtist.foreignArtistId;

          await mediaRepository.save(newMedia);
          this.log(`Saved new media: ${lidarrArtist.artistName}`);
        }
      });
    } catch (e) {
      this.log('Failed to process Lidarr media', 'error', {
        errorMessage: e.message,
        title: lidarrArtist.artistName,
      });
    }
  }
}

export const lidarrScanner = new LidarrScanner();
