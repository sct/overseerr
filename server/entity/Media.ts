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
  AfterUpdate,
} from 'typeorm';
import { MediaRequest } from './MediaRequest';
import { MediaStatus, MediaType } from '../constants/media';
import logger from '../logger';
import Season from './Season';
import notificationManager, { Notification } from '../lib/notifications';
import TheMovieDb from '../api/themoviedb';

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

  public static async getMedia(id: number): Promise<Media | undefined> {
    const mediaRepository = getRepository(Media);

    try {
      const media = await mediaRepository.findOne({
        where: { tmdbId: id },
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

  @Column({ unique: true })
  @Index()
  public tmdbId: number;

  @Column({ unique: true, nullable: true })
  @Index()
  public tvdbId?: number;

  @Column({ unique: true, nullable: true })
  @Index()
  public imdbId?: string;

  @Column({ type: 'int', default: MediaStatus.UNKNOWN })
  public status: MediaStatus;

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

  constructor(init?: Partial<Media>) {
    Object.assign(this, init);
  }

  @AfterUpdate()
  private async notifyAvailable() {
    if (this.status === MediaStatus.AVAILABLE) {
      if (this.mediaType === MediaType.MOVIE) {
        const requestRepository = getRepository(MediaRequest);
        const relatedRequests = await requestRepository.find({
          where: { media: this },
        });

        if (relatedRequests.length > 0) {
          const tmdb = new TheMovieDb();
          const movie = await tmdb.getMovie({ movieId: this.tmdbId });

          relatedRequests.forEach((request) => {
            notificationManager.sendNotification(Notification.MEDIA_AVAILABLE, {
              notifyUser: request.requestedBy,
              subject: movie.title,
              message: movie.overview,
              image: `https://image.tmdb.org/t/p/w600_and_h900_bestv2${movie.poster_path}`,
            });
          });
        }
      }
    }
  }
}

export default Media;
