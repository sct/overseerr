import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  getRepository,
  In,
  AfterLoad,
} from 'typeorm';
import { MediaRequest } from './MediaRequest';
import { MediaStatus, MediaType } from '../constants/media';
import logger from '../logger';
import Season from './Season';
import { getSettings } from '../lib/settings';
import RadarrAPI from '../api/radarr';
import downloadTracker, { DownloadingItem } from '../lib/downloadtracker';

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

  public serviceUrl?: string;
  public serviceUrl4k?: string;
  public downloadStatus?: DownloadingItem[] = [];
  public downloadStatus4k?: DownloadingItem[] = [];

  constructor(init?: Partial<Media>) {
    Object.assign(this, init);
  }

  @AfterLoad()
  public setServiceUrl(): void {
    if (this.serviceId !== null) {
      const settings = getSettings();
      const server = settings.radarr.find(
        (radarr) => radarr.id === this.serviceId
      );

      if (server) {
        this.serviceUrl = server.externalUrl
          ? `${server.externalUrl}/movie/${this.tmdbId}`
          : RadarrAPI.buildRadarrUrl(server, `/movie/${this.tmdbId}`);
      }
    }

    if (this.serviceId4k !== null) {
      const settings = getSettings();
      const server = settings.radarr.find(
        (radarr) => radarr.id === this.serviceId4k
      );

      if (server) {
        this.serviceUrl4k = server.externalUrl
          ? `${server.externalUrl}/movie/${this.tmdbId}`
          : RadarrAPI.buildRadarrUrl(server, `/movie/${this.tmdbId}`);
      }
    }
  }

  @AfterLoad()
  public getDownloadingItem(): void {
    if (
      this.externalServiceId !== undefined &&
      this.serviceId !== undefined &&
      this.status === MediaStatus.PROCESSING
    ) {
      this.downloadStatus = downloadTracker.getMovieProgress(
        this.serviceId,
        this.externalServiceId
      );
    }

    if (
      this.externalServiceId4k !== undefined &&
      this.serviceId4k !== undefined &&
      this.status4k === MediaStatus.PROCESSING
    ) {
      this.downloadStatus4k = downloadTracker.getMovieProgress(
        this.serviceId4k,
        this.externalServiceId4k
      );
    }
  }
}

export default Media;
