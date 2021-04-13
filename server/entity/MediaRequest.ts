import { isEqual } from 'lodash';
import {
  AfterInsert,
  AfterRemove,
  AfterUpdate,
  Column,
  CreateDateColumn,
  Entity,
  getRepository,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationCount,
  UpdateDateColumn,
} from 'typeorm';
import RadarrAPI from '../api/servarr/radarr';
import SonarrAPI, { SonarrSeries } from '../api/servarr/sonarr';
import TheMovieDb from '../api/themoviedb';
import { ANIME_KEYWORD_ID } from '../api/themoviedb/constants';
import { MediaRequestStatus, MediaStatus, MediaType } from '../constants/media';
import notificationManager, { Notification } from '../lib/notifications';
import { getSettings } from '../lib/settings';
import logger from '../logger';
import Media from './Media';
import SeasonRequest from './SeasonRequest';
import { User } from './User';

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

  @ManyToOne(() => User, (user) => user.requests, {
    eager: true,
    onDelete: 'CASCADE',
  })
  public requestedBy: User;

  @ManyToOne(() => User, {
    nullable: true,
    cascade: true,
    eager: true,
    onDelete: 'SET NULL',
  })
  public modifiedBy?: User;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  @Column({ type: 'varchar' })
  public type: MediaType;

  @RelationCount((request: MediaRequest) => request.seasons)
  public seasonCount: number;

  @OneToMany(() => SeasonRequest, (season) => season.request, {
    eager: true,
    cascade: true,
  })
  public seasons: SeasonRequest[];

  @Column({ default: false })
  public is4k: boolean;

  @Column({ nullable: true })
  public serverId: number;

  @Column({ nullable: true })
  public profileId: number;

  @Column({ nullable: true })
  public rootFolder: string;

  @Column({ nullable: true })
  public languageProfileId: number;

  @Column({
    type: 'text',
    nullable: true,
    transformer: {
      from: (value: string | null): number[] | null => {
        if (value) {
          if (value === 'none') {
            return [];
          }
          return value.split(',').map((v) => Number(v));
        }
        return null;
      },
      to: (value: number[] | null): string | null => {
        if (value) {
          const finalValue = value.join(',');

          // We want to keep the actual state of an "empty array" so we use
          // the keyword "none" to track this.
          if (!finalValue) {
            return 'none';
          }

          return finalValue;
        }
        return null;
      },
    },
  })
  public tags?: number[];

  constructor(init?: Partial<MediaRequest>) {
    Object.assign(this, init);
  }

  @AfterUpdate()
  @AfterInsert()
  public async sendMedia(): Promise<void> {
    await Promise.all([this.sendToRadarr(), this.sendToSonarr()]);
  }

  @AfterInsert()
  public async notifyNewRequest(): Promise<void> {
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
          media,
          request: this,
        });
      }

      if (this.type === MediaType.TV) {
        const tv = await tmdb.getTvShow({ tvId: media.tmdbId });
        notificationManager.sendNotification(Notification.MEDIA_PENDING, {
          subject: tv.name,
          message: tv.overview,
          image: `https://image.tmdb.org/t/p/w600_and_h900_bestv2${tv.poster_path}`,
          media,
          extra: [
            {
              name: 'Seasons',
              value: this.seasons
                .map((season) => season.seasonNumber)
                .join(', '),
            },
          ],
          request: this,
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
  public async notifyApprovedOrDeclined(autoApproved = false): Promise<void> {
    if (
      this.status === MediaRequestStatus.APPROVED ||
      this.status === MediaRequestStatus.DECLINED
    ) {
      const mediaRepository = getRepository(Media);
      const media = await mediaRepository.findOne({
        where: { id: this.media.id },
      });
      if (!media) {
        logger.error('No parent media!', { label: 'Media Request' });
        return;
      }

      if (media[this.is4k ? 'status4k' : 'status'] === MediaStatus.AVAILABLE) {
        logger.warn(
          'Media became available before request was approved. Approval notification will be skipped.',
          { label: 'Media Request' }
        );
        return;
      }

      const tmdb = new TheMovieDb();
      if (this.media.mediaType === MediaType.MOVIE) {
        const movie = await tmdb.getMovie({ movieId: this.media.tmdbId });
        notificationManager.sendNotification(
          this.status === MediaRequestStatus.APPROVED
            ? autoApproved
              ? Notification.MEDIA_AUTO_APPROVED
              : Notification.MEDIA_APPROVED
            : Notification.MEDIA_DECLINED,
          {
            subject: movie.title,
            message: movie.overview,
            image: `https://image.tmdb.org/t/p/w600_and_h900_bestv2${movie.poster_path}`,
            notifyUser: autoApproved ? undefined : this.requestedBy,
            media,
            request: this,
          }
        );
      } else if (this.media.mediaType === MediaType.TV) {
        const tv = await tmdb.getTvShow({ tvId: this.media.tmdbId });
        notificationManager.sendNotification(
          this.status === MediaRequestStatus.APPROVED
            ? autoApproved
              ? Notification.MEDIA_AUTO_APPROVED
              : Notification.MEDIA_APPROVED
            : Notification.MEDIA_DECLINED,
          {
            subject: tv.name,
            message: tv.overview,
            image: `https://image.tmdb.org/t/p/w600_and_h900_bestv2${tv.poster_path}`,
            notifyUser: autoApproved ? undefined : this.requestedBy,
            media,
            extra: [
              {
                name: 'Seasons',
                value: this.seasons
                  .map((season) => season.seasonNumber)
                  .join(', '),
              },
            ],
            request: this,
          }
        );
      }
    }
  }

  @AfterInsert()
  public async autoapprovalNotification(): Promise<void> {
    if (this.status === MediaRequestStatus.APPROVED) {
      this.notifyApprovedOrDeclined(true);
    }
  }

  @AfterUpdate()
  @AfterInsert()
  public async updateParentStatus(): Promise<void> {
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
    if (
      this.status === MediaRequestStatus.APPROVED &&
      // Do not update the status if the item is already partially available or available
      media[this.is4k ? 'status4k' : 'status'] !== MediaStatus.AVAILABLE &&
      media[this.is4k ? 'status4k' : 'status'] !==
        MediaStatus.PARTIALLY_AVAILABLE
    ) {
      if (this.is4k) {
        media.status4k = MediaStatus.PROCESSING;
      } else {
        media.status = MediaStatus.PROCESSING;
      }
      mediaRepository.save(media);
    }

    if (
      media.mediaType === MediaType.MOVIE &&
      this.status === MediaRequestStatus.DECLINED
    ) {
      if (this.is4k) {
        media.status4k = MediaStatus.UNKNOWN;
      } else {
        media.status = MediaStatus.UNKNOWN;
      }
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
  public async handleRemoveParentUpdate(): Promise<void> {
    const mediaRepository = getRepository(Media);
    const fullMedia = await mediaRepository.findOneOrFail({
      where: { id: this.media.id },
      relations: ['requests'],
    });

    if (
      !fullMedia.requests.some((request) => !request.is4k) &&
      fullMedia.status !== MediaStatus.AVAILABLE
    ) {
      fullMedia.status = MediaStatus.UNKNOWN;
    }

    if (
      !fullMedia.requests.some((request) => request.is4k) &&
      fullMedia.status4k !== MediaStatus.AVAILABLE
    ) {
      fullMedia.status4k = MediaStatus.UNKNOWN;
    }

    mediaRepository.save(fullMedia);
  }

  public async sendToRadarr(): Promise<void> {
    if (
      this.status === MediaRequestStatus.APPROVED &&
      this.type === MediaType.MOVIE
    ) {
      try {
        const mediaRepository = getRepository(Media);
        const settings = getSettings();
        if (settings.radarr.length === 0 && !settings.radarr[0]) {
          logger.info(
            'Skipped Radarr request as there is no Radarr server configured',
            { label: 'Media Request' }
          );
          return;
        }

        let radarrSettings = settings.radarr.find(
          (radarr) => radarr.isDefault && radarr.is4k === this.is4k
        );

        if (
          this.serverId !== null &&
          this.serverId >= 0 &&
          radarrSettings?.id !== this.serverId
        ) {
          radarrSettings = settings.radarr.find(
            (radarr) => radarr.id === this.serverId
          );
          logger.info(
            `Request has an override server: ${radarrSettings?.name}`,
            { label: 'Media Request' }
          );
        }

        if (!radarrSettings) {
          logger.info(
            `There is no default ${
              this.is4k ? '4K ' : ''
            }Radarr server configured. Did you set any of your ${
              this.is4k ? '4K ' : ''
            }Radarr servers as default?`,
            { label: 'Media Request' }
          );
          return;
        }

        let rootFolder = radarrSettings.activeDirectory;
        let qualityProfile = radarrSettings.activeProfileId;
        let tags = radarrSettings.tags;

        if (
          this.rootFolder &&
          this.rootFolder !== '' &&
          this.rootFolder !== radarrSettings.activeDirectory
        ) {
          rootFolder = this.rootFolder;
          logger.info(`Request has an override root folder: ${rootFolder}`, {
            label: 'Media Request',
          });
        }

        if (
          this.profileId &&
          this.profileId !== radarrSettings.activeProfileId
        ) {
          qualityProfile = this.profileId;
          logger.info(`Request has an override profile id: ${qualityProfile}`, {
            label: 'Media Request',
          });
        }

        if (this.tags && !isEqual(this.tags, radarrSettings.tags)) {
          tags = this.tags;
          logger.info(`Request has override tags`, {
            label: 'Media Request',
            tagIds: tags,
          });
        }

        const tmdb = new TheMovieDb();
        const radarr = new RadarrAPI({
          apiKey: radarrSettings.apiKey,
          url: RadarrAPI.buildUrl(radarrSettings, '/api/v3'),
        });
        const movie = await tmdb.getMovie({ movieId: this.media.tmdbId });

        const media = await mediaRepository.findOne({
          where: { id: this.media.id },
        });

        if (!media) {
          logger.error('Media not present');
          return;
        }

        if (
          media[this.is4k ? 'status4k' : 'status'] === MediaStatus.AVAILABLE
        ) {
          throw new Error('Media already available');
        }

        // Run this asynchronously so we don't wait for it on the UI side
        radarr
          .addMovie({
            profileId: qualityProfile,
            qualityProfileId: qualityProfile,
            rootFolderPath: rootFolder,
            minimumAvailability: radarrSettings.minimumAvailability,
            title: movie.title,
            tmdbId: movie.id,
            year: Number(movie.release_date.slice(0, 4)),
            monitored: true,
            tags,
            searchNow: !radarrSettings.preventSearch,
          })
          .then(async (radarrMovie) => {
            // We grab media again here to make sure we have the latest version of it
            const media = await mediaRepository.findOne({
              where: { id: this.media.id },
            });

            if (!media) {
              throw new Error('Media data is missing');
            }

            media[this.is4k ? 'externalServiceId4k' : 'externalServiceId'] =
              radarrMovie.id;
            media[this.is4k ? 'externalServiceSlug4k' : 'externalServiceSlug'] =
              radarrMovie.titleSlug;
            media[this.is4k ? 'serviceId4k' : 'serviceId'] = radarrSettings?.id;
            await mediaRepository.save(media);
          })
          .catch(async () => {
            media.status = MediaStatus.UNKNOWN;
            await mediaRepository.save(media);
            logger.warn(
              'Newly added movie request failed to add to Radarr, marking as unknown',
              {
                label: 'Media Request',
              }
            );

            notificationManager.sendNotification(Notification.MEDIA_FAILED, {
              subject: movie.title,
              message: movie.overview,
              media,
              image: `https://image.tmdb.org/t/p/w600_and_h900_bestv2${movie.poster_path}`,
              request: this,
            });
          });
        logger.info('Sent request to Radarr', { label: 'Media Request' });
      } catch (e) {
        const errorMessage = `Request failed to send to Radarr: ${e.message}`;
        logger.error('Request failed to send to Radarr', {
          label: 'Media Request',
          errorMessage,
        });
        throw new Error(errorMessage);
      }
    }
  }

  public async sendToSonarr(): Promise<void> {
    if (
      this.status === MediaRequestStatus.APPROVED &&
      this.type === MediaType.TV
    ) {
      try {
        const mediaRepository = getRepository(Media);
        const settings = getSettings();
        if (settings.sonarr.length === 0 && !settings.sonarr[0]) {
          logger.info(
            'Skipped Sonarr request as there is no Sonarr server configured',
            { label: 'Media Request' }
          );
          return;
        }

        let sonarrSettings = settings.sonarr.find(
          (sonarr) => sonarr.isDefault && sonarr.is4k === this.is4k
        );

        if (
          this.serverId !== null &&
          this.serverId >= 0 &&
          sonarrSettings?.id !== this.serverId
        ) {
          sonarrSettings = settings.sonarr.find(
            (sonarr) => sonarr.id === this.serverId
          );
          logger.info(
            `Request has an override server: ${sonarrSettings?.name}`,
            { label: 'Media Request' }
          );
        }

        if (!sonarrSettings) {
          logger.info(
            `There is no default ${
              this.is4k ? '4K ' : ''
            }Sonarr server configured. Did you set any of your ${
              this.is4k ? '4K ' : ''
            }Sonarr servers as default?`,
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

        if (
          media[this.is4k ? 'status4k' : 'status'] === MediaStatus.AVAILABLE
        ) {
          throw new Error('Media already available');
        }

        const tmdb = new TheMovieDb();
        const sonarr = new SonarrAPI({
          apiKey: sonarrSettings.apiKey,
          url: SonarrAPI.buildUrl(sonarrSettings, '/api/v3'),
        });
        const series = await tmdb.getTvShow({ tvId: media.tmdbId });
        const tvdbId = series.external_ids.tvdb_id ?? media.tvdbId;

        if (!tvdbId) {
          const requestRepository = getRepository(MediaRequest);
          await mediaRepository.remove(media);
          await requestRepository.remove(this);
          throw new Error('Series was missing tvdb id');
        }

        let seriesType: SonarrSeries['seriesType'] = 'standard';

        // Change series type to anime if the anime keyword is present on tmdb
        if (
          series.keywords.results.some(
            (keyword) => keyword.id === ANIME_KEYWORD_ID
          )
        ) {
          seriesType = 'anime';
        }

        let rootFolder =
          seriesType === 'anime' && sonarrSettings.activeAnimeDirectory
            ? sonarrSettings.activeAnimeDirectory
            : sonarrSettings.activeDirectory;
        let qualityProfile =
          seriesType === 'anime' && sonarrSettings.activeAnimeProfileId
            ? sonarrSettings.activeAnimeProfileId
            : sonarrSettings.activeProfileId;

        let languageProfile =
          seriesType === 'anime' && sonarrSettings.activeAnimeLanguageProfileId
            ? sonarrSettings.activeAnimeLanguageProfileId
            : sonarrSettings.activeLanguageProfileId;

        let tags =
          seriesType === 'anime'
            ? sonarrSettings.animeTags
            : sonarrSettings.tags;

        if (
          this.rootFolder &&
          this.rootFolder !== '' &&
          this.rootFolder !== rootFolder
        ) {
          rootFolder = this.rootFolder;
          logger.info(`Request has an override root folder: ${rootFolder}`, {
            label: 'Media Request',
          });
        }

        if (this.profileId && this.profileId !== qualityProfile) {
          qualityProfile = this.profileId;
          logger.info(`Request has an override profile ID: ${qualityProfile}`, {
            label: 'Media Request',
          });
        }

        if (
          this.languageProfileId &&
          this.languageProfileId !== languageProfile
        ) {
          languageProfile = this.languageProfileId;
          logger.info(
            `Request has an override Language Profile: ${languageProfile}`,
            {
              label: 'Media Request',
            }
          );
        }

        if (this.tags && !isEqual(this.tags, tags)) {
          tags = this.tags;
          logger.info(`Request has override tags`, {
            label: 'Media Request',
            tagIds: tags,
          });
        }

        // Run this asynchronously so we don't wait for it on the UI side
        sonarr
          .addSeries({
            profileId: qualityProfile,
            languageProfileId: languageProfile,
            rootFolderPath: rootFolder,
            title: series.name,
            tvdbid: tvdbId,
            seasons: this.seasons.map((season) => season.seasonNumber),
            seasonFolder: sonarrSettings.enableSeasonFolders,
            seriesType,
            tags,
            monitored: true,
            searchNow: !sonarrSettings.preventSearch,
          })
          .then(async (sonarrSeries) => {
            // We grab media again here to make sure we have the latest version of it
            const media = await mediaRepository.findOne({
              where: { id: this.media.id },
              relations: ['requests'],
            });

            if (!media) {
              throw new Error('Media data is missing');
            }

            media[this.is4k ? 'externalServiceId4k' : 'externalServiceId'] =
              sonarrSeries.id;
            media[this.is4k ? 'externalServiceSlug4k' : 'externalServiceSlug'] =
              sonarrSeries.titleSlug;
            media[this.is4k ? 'serviceId4k' : 'serviceId'] = sonarrSettings?.id;
            await mediaRepository.save(media);
          })
          .catch(async () => {
            media.status = MediaStatus.UNKNOWN;
            await mediaRepository.save(media);
            logger.warn(
              'Newly added series request failed to add to Sonarr, marking as unknown',
              {
                label: 'Media Request',
              }
            );

            notificationManager.sendNotification(Notification.MEDIA_FAILED, {
              subject: series.name,
              message: series.overview,
              image: `https://image.tmdb.org/t/p/w600_and_h900_bestv2${series.poster_path}`,
              media,
              extra: [
                {
                  name: 'Seasons',
                  value: this.seasons
                    .map((season) => season.seasonNumber)
                    .join(', '),
                },
              ],
              request: this,
            });
          });
        logger.info('Sent request to Sonarr', { label: 'Media Request' });
      } catch (e) {
        const errorMessage = `Request failed to send to Sonarr: ${e.message}`;
        logger.error('Request failed to send to Sonarr', {
          label: 'Media Request',
          errorMessage,
        });
        throw new Error(errorMessage);
      }
    }
  }
}
