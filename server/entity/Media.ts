import {
  AfterLoad,
  Column,
  CreateDateColumn,
  Entity,
  getRepository,
  In,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import RadarrAPI from '../api/servarr/radarr';
import SonarrAPI from '../api/servarr/sonarr';
import { MediaStatus, MediaType } from '../constants/media';
import downloadTracker, { DownloadingItem } from '../lib/downloadtracker';
import { getSettings } from '../lib/settings';
import logger from '../logger';
import { MediaRequest } from './MediaRequest';
import Season from './Season';

@Entity()
class Media {
  public static async getRelatedMedia(
    tmdbIds: number | number[]
  ): Promise<Media[]> {
    const mediaRepository = getRepository(Media);

    try {
      let finalIds: number[];
      if (!Array.isArray(tmdbIds)) {
        finalIds = [tmdbIds];
      } else {
        finalIds = tmdbIds;
      }

      const media = await mediaRepository.find({
        tmdbId: In(finalIds),
      });

      return media;
    } catch (e) {
      logger.error(e.message);
      return [];
    }
  }

  public static async getMedia(
    id: number,
    mediaType: MediaType
  ): Promise<Media | undefined> {
    const mediaRepository = getRepository(Media);

    try {
      const media = await mediaRepository.findOne({
        where: { tmdbId: id, mediaType },
        relations: ['requests'],
      });

      return media;
    } catch (e) {
      logger.error(e.message);
      return undefined;
    }
  }

  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'varchar' })
  public mediaType: MediaType;

  @Column()
  @Index()
  public tmdbId: number;

  @Column({ unique: true, nullable: true })
  @Index()
  public tvdbId?: number;

  @Column({ nullable: true })
  @Index()
  public imdbId?: string;

  @Column({ type: 'int', default: MediaStatus.UNKNOWN })
  public status: MediaStatus;

  @Column({ type: 'int', default: MediaStatus.UNKNOWN })
  public status4k: MediaStatus;

  @OneToMany(() => MediaRequest, (request) => request.media, { cascade: true })
  public requests: MediaRequest[];

  @OneToMany(() => Season, (season) => season.media, {
    cascade: true,
    eager: true,
  })
  public seasons: Season[];

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  public lastSeasonChange: Date;

  @Column({ type: 'datetime', nullable: true })
  public mediaAddedAt: Date;

  @Column({ nullable: true })
  public serviceId?: number;

  @Column({ nullable: true })
  public serviceId4k?: number;

  @Column({ nullable: true })
  public externalServiceId?: number;

  @Column({ nullable: true })
  public externalServiceId4k?: number;

  @Column({ nullable: true })
  public externalServiceSlug?: string;

  @Column({ nullable: true })
  public externalServiceSlug4k?: string;

  @Column({ nullable: true })
  public ratingKey?: string;

  @Column({ nullable: true })
  public ratingKey4k?: string;

  public serviceUrl?: string;
  public serviceUrl4k?: string;
  public downloadStatus?: DownloadingItem[] = [];
  public downloadStatus4k?: DownloadingItem[] = [];

  public plexUrl?: string;
  public plexUrl4k?: string;

  constructor(init?: Partial<Media>) {
    Object.assign(this, init);
  }

  @AfterLoad()
  public setPlexUrls(): void {
    const machineId = getSettings().plex.machineId;
    if (this.ratingKey) {
      this.plexUrl = `https://app.plex.tv/desktop#!/server/${machineId}/details?key=%2Flibrary%2Fmetadata%2F${this.ratingKey}`;
    }
    if (this.ratingKey4k) {
      this.plexUrl4k = `https://app.plex.tv/desktop#!/server/${machineId}/details?key=%2Flibrary%2Fmetadata%2F${this.ratingKey4k}`;
    }
  }

  @AfterLoad()
  public setServiceUrl(): void {
    if (this.mediaType === MediaType.MOVIE) {
      if (this.serviceId !== null && this.externalServiceSlug !== null) {
        const settings = getSettings();
        const server = settings.radarr.find(
          (radarr) => radarr.id === this.serviceId
        );

        if (server) {
          this.serviceUrl = server.externalUrl
            ? `${server.externalUrl}/movie/${this.externalServiceSlug}`
            : RadarrAPI.buildUrl(server, `/movie/${this.externalServiceSlug}`);
        }
      }

      if (this.serviceId4k !== null && this.externalServiceSlug4k !== null) {
        const settings = getSettings();
        const server = settings.radarr.find(
          (radarr) => radarr.id === this.serviceId4k
        );

        if (server) {
          this.serviceUrl4k = server.externalUrl
            ? `${server.externalUrl}/movie/${this.externalServiceSlug4k}`
            : RadarrAPI.buildUrl(
                server,
                `/movie/${this.externalServiceSlug4k}`
              );
        }
      }
    }

    if (this.mediaType === MediaType.TV) {
      if (this.serviceId !== null && this.externalServiceSlug !== null) {
        const settings = getSettings();
        const server = settings.sonarr.find(
          (sonarr) => sonarr.id === this.serviceId
        );

        if (server) {
          this.serviceUrl = server.externalUrl
            ? `${server.externalUrl}/series/${this.externalServiceSlug}`
            : SonarrAPI.buildUrl(server, `/series/${this.externalServiceSlug}`);
        }
      }

      if (this.serviceId4k !== null && this.externalServiceSlug4k !== null) {
        const settings = getSettings();
        const server = settings.sonarr.find(
          (sonarr) => sonarr.id === this.serviceId4k
        );

        if (server) {
          this.serviceUrl4k = server.externalUrl
            ? `${server.externalUrl}/series/${this.externalServiceSlug4k}`
            : SonarrAPI.buildUrl(
                server,
                `/series/${this.externalServiceSlug4k}`
              );
        }
      }
    }
  }

  @AfterLoad()
  public getDownloadingItem(): void {
    if (this.mediaType === MediaType.MOVIE) {
      if (
        this.externalServiceId !== undefined &&
        this.serviceId !== undefined
      ) {
        this.downloadStatus = downloadTracker.getMovieProgress(
          this.serviceId,
          this.externalServiceId
        );
      }

      if (
        this.externalServiceId4k !== undefined &&
        this.serviceId4k !== undefined
      ) {
        this.downloadStatus4k = downloadTracker.getMovieProgress(
          this.serviceId4k,
          this.externalServiceId4k
        );
      }
    }

    if (this.mediaType === MediaType.TV) {
      if (
        this.externalServiceId !== undefined &&
        this.serviceId !== undefined
      ) {
        this.downloadStatus = downloadTracker.getSeriesProgress(
          this.serviceId,
          this.externalServiceId
        );
      }

      if (
        this.externalServiceId4k !== undefined &&
        this.serviceId4k !== undefined
      ) {
        this.downloadStatus4k = downloadTracker.getSeriesProgress(
          this.serviceId4k,
          this.externalServiceId4k
        );
      }
    }
  }
}

export default Media;
