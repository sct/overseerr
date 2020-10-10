import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  AfterUpdate,
  AfterInsert,
  getRepository,
  OneToMany,
} from 'typeorm';
import { User } from './User';
import Media from './Media';
import { MediaStatus, MediaRequestStatus, MediaType } from '../constants/media';
import { getSettings } from '../lib/settings';
import TheMovieDb from '../api/themoviedb';
import RadarrAPI from '../api/radarr';
import logger from '../logger';
import SeasonRequest from './SeasonRequest';

@Entity()
export class MediaRequest {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'integer' })
  public status: MediaRequestStatus;

  @ManyToOne(() => Media, (media) => media.requests, { eager: true })
  public media: Media;

  @ManyToOne(() => User, (user) => user.requests, { eager: true })
  public requestedBy: User;

  @ManyToOne(() => User, { nullable: true })
  public modifiedBy?: User;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  @Column({ type: 'varchar' })
  public type: MediaType;

  @OneToMany(() => SeasonRequest, (season) => season.request, {
    eager: true,
    cascade: true,
  })
  public seasons: SeasonRequest[];

  constructor(init?: Partial<MediaRequest>) {
    Object.assign(this, init);
  }

  @AfterUpdate()
  @AfterInsert()
  private async updateParentStatus() {
    const mediaRepository = getRepository(Media);
    if (this.status === MediaRequestStatus.APPROVED) {
      this.media.status = MediaStatus.PROCESSING;
      mediaRepository.save(this.media);
    }
  }

  @AfterUpdate()
  @AfterInsert()
  private async sendToRadarr() {
    if (
      this.status === MediaRequestStatus.APPROVED &&
      this.type === MediaType.MOVIE
    ) {
      try {
        const settings = getSettings();
        if (settings.radarr.length === 0 && !settings.radarr[0]) {
          logger.info(
            'Skipped radarr request as there is no radarr configured',
            { label: 'Media Request' }
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
        const movie = await tmdb.getMovie({ movieId: this.media.tmdbId });

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
        logger.info('Sent request to Radarr', { label: 'Media Request' });
      } catch (e) {
        throw new Error(
          `[MediaRequest] Request failed to send to radarr: ${e.message}`
        );
      }
    }
  }
}
