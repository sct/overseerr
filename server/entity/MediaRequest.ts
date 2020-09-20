import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  getRepository,
  In,
  Index,
  AfterUpdate,
  AfterInsert,
} from 'typeorm';
import { User } from './User';
import RadarrAPI from '../api/radarr';
import { getSettings } from '../lib/settings';
import TheMovieDb from '../api/themoviedb';

export enum MediaRequestStatus {
  PENDING = 1,
  APPROVED,
  DECLINED,
  AVAILABLE,
}

@Entity()
export class MediaRequest {
  public static async getRelatedRequests(
    mediaIds: number | number[]
  ): Promise<MediaRequest[]> {
    const requestRepository = getRepository(MediaRequest);

    try {
      let finalIds: number[];
      if (!Array.isArray(mediaIds)) {
        finalIds = [mediaIds];
      } else {
        finalIds = mediaIds;
      }

      const requests = await requestRepository.find({
        mediaId: In(finalIds),
      });

      return requests;
    } catch (e) {
      console.error(e.messaage);
      return [];
    }
  }

  public static async getRequest(
    id: number
  ): Promise<MediaRequest | undefined> {
    const requestRepository = getRepository(MediaRequest);

    try {
      const request = await requestRepository.findOneOrFail({
        where: { mediaId: id },
      });

      return request;
    } catch (e) {
      console.error(e.messaage);
      return undefined;
    }
  }

  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ unique: true })
  @Index()
  public mediaId: number;

  @Column({ unique: true, nullable: true })
  @Index()
  public tvdbId: number;

  @Column({ nullable: true })
  public seasons?: string;

  @Column()
  public mediaType: 'movie' | 'tv';

  @Column({ type: 'integer' })
  public status: MediaRequestStatus;

  @ManyToOne(() => User, (user) => user.requests, { eager: true })
  public requestedBy: User;

  @ManyToOne(() => User, { nullable: true })
  public modifiedBy?: User;
  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  constructor(init?: Partial<MediaRequest>) {
    Object.assign(this, init);
  }

  @AfterUpdate()
  @AfterInsert()
  private async sendToRadarr() {
    if (
      this.mediaType === 'movie' &&
      this.status === MediaRequestStatus.APPROVED
    ) {
      try {
        const settings = getSettings();
        if (settings.radarr.length === 0 && !settings.radarr[0]) {
          console.log(
            '[MediaRequest] Skipped radarr request as there is no radarr configured'
          );
          return;
        }

        const tmdb = new TheMovieDb();
        const radarrSettings = settings.radarr[0];
        const radarr = new RadarrAPI({
          apiKey: radarrSettings.apiKey,
          url: `${radarrSettings.useSsl ? 'https' : 'http'}://${
            radarrSettings.hostname
          }:${radarrSettings.port}/api`,
        });
        const movie = await tmdb.getMovie({ movieId: this.mediaId });

        await radarr.addMovie({
          profileId: radarrSettings.activeProfileId,
          qualityProfileId: radarrSettings.activeProfileId,
          rootFolderPath: radarrSettings.activeDirectory,
          title: movie.title,
          tmdbId: movie.id,
          year: Number(movie.release_date.slice(0, 4)),
          monitored: true,
          searchNow: true,
        });
        console.log('[MediaRequest] Sent request to Radarr');
      } catch (e) {
        throw new Error(
          `[MediaRequest] Request failed to send to radarr: ${e.message}`
        );
      }
    }
  }
}
