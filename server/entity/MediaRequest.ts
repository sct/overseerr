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
  AfterRemove,
} from 'typeorm';
import { User } from './User';
import Media from './Media';
import { MediaStatus, MediaRequestStatus, MediaType } from '../constants/media';
import { getSettings } from '../lib/settings';
import TheMovieDb from '../api/themoviedb';
import RadarrAPI from '../api/radarr';
import logger from '../logger';
import SeasonRequest from './SeasonRequest';
import SonarrAPI from '../api/sonarr';
import notificationManager, { Notification } from '../lib/notifications';

@Entity()
export class MediaRequest {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'integer' })
  public status: MediaRequestStatus;

  @ManyToOne(() => Media, (media) => media.requests, {
    eager: true,
    onDelete: 'CASCADE',
  })
  public media: Media;

  @ManyToOne(() => User, (user) => user.requests, { eager: true })
  public requestedBy: User;

  @ManyToOne(() => User, { nullable: true, cascade: true, eager: true })
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

  @AfterInsert()
  private async notifyNewRequest() {
    if (this.status === MediaRequestStatus.PENDING) {
      const mediaRepository = getRepository(Media);
      const media = await mediaRepository.findOne({
        where: { id: this.media.id },
      });
      if (!media) {
        logger.error('No parent media!', { label: 'Media Request' });
        return;
      }
      const tmdb = new TheMovieDb();
      if (this.type === MediaType.MOVIE) {
        const movie = await tmdb.getMovie({ movieId: media.tmdbId });
        notificationManager.sendNotification(Notification.MEDIA_PENDING, {
          subject: movie.title,
          message: movie.overview,
          image: `https://image.tmdb.org/t/p/w600_and_h900_bestv2${movie.poster_path}`,
          notifyUser: this.requestedBy,
        });
      }

      if (this.type === MediaType.TV) {
        const tv = await tmdb.getTvShow({ tvId: media.tmdbId });
        notificationManager.sendNotification(Notification.MEDIA_PENDING, {
          subject: tv.name,
          message: tv.overview,
          image: `https://image.tmdb.org/t/p/w600_and_h900_bestv2${tv.poster_path}`,
          notifyUser: this.requestedBy,
          extra: [
            {
              name: 'Seasons',
              value: this.seasons
                .map((season) => season.seasonNumber)
                .join(', '),
            },
          ],
        });
      }
    }
  }

  /**
   * Notification for approval
   *
   * We only check on AfterUpdate as to not trigger this for
   * auto approved content
   */
  @AfterUpdate()
  private async notifyApproved() {
    if (this.status === MediaRequestStatus.APPROVED) {
      const mediaRepository = getRepository(Media);
      const media = await mediaRepository.findOne({
        where: { id: this.media.id },
      });
      if (!media) {
        logger.error('No parent media!', { label: 'Media Request' });
        return;
      }
      const tmdb = new TheMovieDb();
      if (this.media.mediaType === MediaType.MOVIE) {
        const movie = await tmdb.getMovie({ movieId: this.media.tmdbId });
        notificationManager.sendNotification(Notification.MEDIA_APPROVED, {
          subject: movie.title,
          message: movie.overview,
          image: `https://image.tmdb.org/t/p/w600_and_h900_bestv2${movie.poster_path}`,
          notifyUser: this.requestedBy,
        });
      } else if (this.media.mediaType === MediaType.TV) {
        const tv = await tmdb.getTvShow({ tvId: this.media.tmdbId });
        notificationManager.sendNotification(Notification.MEDIA_APPROVED, {
          subject: tv.name,
          message: tv.overview,
          image: `https://image.tmdb.org/t/p/w600_and_h900_bestv2${tv.poster_path}`,
          notifyUser: this.requestedBy,
          extra: [
            {
              name: 'Seasons',
              value: this.seasons
                .map((season) => season.seasonNumber)
                .join(', '),
            },
          ],
        });
      }
    }
  }

  @AfterUpdate()
  @AfterInsert()
  private async updateParentStatus() {
    const mediaRepository = getRepository(Media);
    const media = await mediaRepository.findOne({
      where: { id: this.media.id },
      relations: ['requests'],
    });
    if (!media) {
      logger.error('No parent media!', { label: 'Media Request' });
      return;
    }
    const seasonRequestRepository = getRepository(SeasonRequest);
    if (this.status === MediaRequestStatus.APPROVED) {
      media.status = MediaStatus.PROCESSING;
      mediaRepository.save(media);
    }

    if (
      this.media.mediaType === MediaType.MOVIE &&
      this.status === MediaRequestStatus.DECLINED
    ) {
      media.status = MediaStatus.UNKNOWN;
      mediaRepository.save(media);
    }

    /**
     * If the media type is TV, and we are declining a request,
     * we must check if its the only pending request and that
     * there the current media status is just pending (meaning no
     * other requests have yet to be approved)
     */
    if (
      media.mediaType === MediaType.TV &&
      this.status === MediaRequestStatus.DECLINED &&
      media.requests.filter(
        (request) => request.status === MediaRequestStatus.PENDING
      ).length === 0 &&
      media.status === MediaStatus.PENDING
    ) {
      media.status = MediaStatus.UNKNOWN;
      mediaRepository.save(media);
    }

    // Approve child seasons if parent is approved
    if (
      media.mediaType === MediaType.TV &&
      this.status === MediaRequestStatus.APPROVED
    ) {
      this.seasons.forEach((season) => {
        season.status = MediaRequestStatus.APPROVED;
        seasonRequestRepository.save(season);
      });
    }
  }

  @AfterRemove()
  private async handleRemoveParentUpdate() {
    const mediaRepository = getRepository(Media);
    const fullMedia = await mediaRepository.findOneOrFail({
      where: { id: this.media.id },
    });
    if (!fullMedia.requests || fullMedia.requests.length === 0) {
      fullMedia.status = MediaStatus.UNKNOWN;
      mediaRepository.save(fullMedia);
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

        // Run this asynchronously so we don't wait for it on the UI side
        radarr.addMovie({
          profileId: radarrSettings.activeProfileId,
          qualityProfileId: radarrSettings.activeProfileId,
          rootFolderPath: radarrSettings.activeDirectory,
          minimumAvailability: radarrSettings.minimumAvailability,
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

  @AfterUpdate()
  @AfterInsert()
  private async sendToSonarr() {
    if (
      this.status === MediaRequestStatus.APPROVED &&
      this.type === MediaType.TV
    ) {
      try {
        const mediaRepository = getRepository(Media);
        const settings = getSettings();
        if (settings.sonarr.length === 0 && !settings.sonarr[0]) {
          logger.info(
            'Skipped sonarr request as there is no sonarr configured',
            { label: 'Media Request' }
          );
          return;
        }

        const media = await mediaRepository.findOne({
          where: { id: this.media.id },
          relations: ['requests'],
        });

        if (!media) {
          throw new Error('Media data is missing');
        }

        const tmdb = new TheMovieDb();
        const sonarrSettings = settings.sonarr[0];
        const sonarr = new SonarrAPI({
          apiKey: sonarrSettings.apiKey,
          url: `${sonarrSettings.useSsl ? 'https' : 'http'}://${
            sonarrSettings.hostname
          }:${sonarrSettings.port}/api`,
        });
        const series = await tmdb.getTvShow({ tvId: media.tmdbId });

        if (!series.external_ids.tvdb_id) {
          throw new Error('Series was missing tvdb id');
        }

        // Run this asynchronously so we don't wait for it on the UI side
        sonarr.addSeries({
          profileId: sonarrSettings.activeProfileId,
          rootFolderPath: sonarrSettings.activeDirectory,
          title: series.name,
          tvdbid: series.external_ids.tvdb_id,
          seasons: this.seasons.map((season) => season.seasonNumber),
          monitored: true,
          searchNow: true,
        });
        logger.info('Sent request to Sonarr', { label: 'Media Request' });
      } catch (e) {
        throw new Error(
          `[MediaRequest] Request failed to send to sonarr: ${e.message}`
        );
      }
    }
  }
}
