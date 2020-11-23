import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  AfterInsert,
  AfterUpdate,
  getRepository,
  RelationId,
} from 'typeorm';
import { MediaStatus } from '../constants/media';
import Media from './Media';
import logger from '../logger';
import TheMovieDb from '../api/themoviedb';
import notificationManager, { Notification } from '../lib/notifications';

@Entity()
class Season {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public seasonNumber: number;

  @Column({ type: 'int', default: MediaStatus.UNKNOWN })
  public status: MediaStatus;

  @ManyToOne(() => Media, (media) => media.seasons, { onDelete: 'CASCADE' })
  public media: Promise<Media>;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  constructor(init?: Partial<Season>) {
    Object.assign(this, init);
  }

  @AfterInsert()
  @AfterUpdate()
  private async sendSeasonAvailableNotification() {
    if (this.status === MediaStatus.AVAILABLE) {
      try {
        const lazyMedia = await this.media;
        const tmdb = new TheMovieDb();
        const mediaRepository = getRepository(Media);
        const media = await mediaRepository.findOneOrFail({
          where: { id: lazyMedia.id },
          relations: ['requests'],
        });

        const availableSeasons = media.seasons.map(
          (season) => season.seasonNumber
        );

        const request = media.requests.find(
          (request) =>
            // Check if the season is complete AND it contains the current season that was just marked available
            request.seasons.every((season) =>
              availableSeasons.includes(season.seasonNumber)
            ) &&
            request.seasons.some(
              (season) => season.seasonNumber === this.seasonNumber
            )
        );

        if (request) {
          const tv = await tmdb.getTvShow({ tvId: media.tmdbId });
          notificationManager.sendNotification(Notification.MEDIA_AVAILABLE, {
            subject: tv.name,
            message: tv.overview,
            notifyUser: request.requestedBy,
            image: `https://image.tmdb.org/t/p/w600_and_h900_bestv2${tv.poster_path}`,
            extra: [
              {
                name: 'Seasons',
                value: request.seasons
                  .map((season) => season.seasonNumber)
                  .join(', '),
              },
            ],
          });
        }
      } catch (e) {
        logger.error('Something went wrong sending season available notice', {
          label: 'Notifications',
          message: e.message,
        });
      }
    }
  }
}

export default Season;
