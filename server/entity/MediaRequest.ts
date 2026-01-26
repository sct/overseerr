import TheMovieDb from '@server/api/themoviedb';
import MusicBrainzAPI from '@server/api/musicbrainz';
import {
  MediaRequestStatus,
  MediaStatus,
  MediaType,
} from '@server/constants/media';
import { getRepository } from '@server/datasource';
import type { MediaRequestBody } from '@server/interfaces/api/requestInterfaces';
import notificationManager, { Notification } from '@server/lib/notifications';
import { Permission } from '@server/lib/permissions';
import logger from '@server/logger';
import { isValidMBID } from '@server/utils/validation';
import { truncate } from 'lodash';
import {
  AfterInsert,
  AfterUpdate,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationCount,
  UpdateDateColumn,
} from 'typeorm';
import Media from './Media';
import SeasonRequest from './SeasonRequest';
import { User } from './User';

export class RequestPermissionError extends Error {}
export class QuotaRestrictedError extends Error {}
export class DuplicateMediaRequestError extends Error {}
export class NoSeasonsAvailableError extends Error {}

type MediaRequestOptions = {
  isAutoRequest?: boolean;
};

@Entity()
export class MediaRequest {
  public static async request(
    requestBody: MediaRequestBody,
    user: User,
    options: MediaRequestOptions = {}
  ): Promise<MediaRequest> {
    const tmdb = new TheMovieDb();
    const mediaRepository = getRepository(Media);
    const requestRepository = getRepository(MediaRequest);
    const userRepository = getRepository(User);

    let requestUser = user;

    if (
      requestBody.userId &&
      !requestUser.hasPermission([
        Permission.MANAGE_USERS,
        Permission.MANAGE_REQUESTS,
      ])
    ) {
      throw new RequestPermissionError(
        'You do not have permission to modify the request user.'
      );
    } else if (requestBody.userId) {
      requestUser = await userRepository.findOneOrFail({
        where: { id: requestBody.userId },
      });
    }

    if (!requestUser) {
      throw new Error('User missing from request context.');
    }

    if (
      requestBody.mediaType === MediaType.MOVIE &&
      !requestUser.hasPermission(
        requestBody.is4k
          ? [Permission.REQUEST_4K, Permission.REQUEST_4K_MOVIE]
          : [Permission.REQUEST, Permission.REQUEST_MOVIE],
        {
          type: 'or',
        }
      )
    ) {
      throw new RequestPermissionError(
        `You do not have permission to make ${
          requestBody.is4k ? '4K ' : ''
        }movie requests.`
      );
    } else if (
      requestBody.mediaType === MediaType.TV &&
      !requestUser.hasPermission(
        requestBody.is4k
          ? [Permission.REQUEST_4K, Permission.REQUEST_4K_TV]
          : [Permission.REQUEST, Permission.REQUEST_TV],
        {
          type: 'or',
        }
      )
    ) {
      throw new RequestPermissionError(
        `You do not have permission to make ${
          requestBody.is4k ? '4K ' : ''
        }series requests.`
      );
    } else if (
      (requestBody.mediaType === MediaType.MUSIC ||
        requestBody.mediaType === MediaType.ARTIST ||
        requestBody.mediaType === MediaType.ALBUM) &&
      !requestUser.hasPermission([Permission.REQUEST], { type: 'or' })
    ) {
      throw new RequestPermissionError(
        'You do not have permission to make music requests.'
      );
    }

    const quotas = await requestUser.getQuota();

    if (requestBody.mediaType === MediaType.MOVIE && quotas.movie.restricted) {
      throw new QuotaRestrictedError('Movie Quota exceeded.');
    } else if (requestBody.mediaType === MediaType.TV && quotas.tv.restricted) {
      throw new QuotaRestrictedError('Series Quota exceeded.');
    } else if (
      (requestBody.mediaType === MediaType.MUSIC ||
        requestBody.mediaType === MediaType.ARTIST ||
        requestBody.mediaType === MediaType.ALBUM) &&
      quotas.music?.restricted
    ) {
      throw new QuotaRestrictedError('Music Quota exceeded.');
    }

    // Validate mediaId is provided for movie/TV requests
    if (
      (requestBody.mediaType === MediaType.MOVIE ||
        requestBody.mediaType === MediaType.TV) &&
      !requestBody.mediaId
    ) {
      throw new Error(
        `TMDB ID (mediaId) is required for ${requestBody.mediaType} requests`
      );
    }

    const tmdbMedia =
      requestBody.mediaType === MediaType.MOVIE
        ? await tmdb.getMovie({ movieId: requestBody.mediaId! })
        : requestBody.mediaType === MediaType.TV
        ? await tmdb.getTvShow({ tvId: requestBody.mediaId! })
        : null;

    let media = await mediaRepository.findOne({
      where:
        requestBody.mediaType === MediaType.MUSIC ||
        requestBody.mediaType === MediaType.ARTIST ||
        requestBody.mediaType === MediaType.ALBUM
          ? {
              musicBrainzId: requestBody.musicBrainzId,
              mediaType: requestBody.mediaType,
            }
          : {
              tmdbId: requestBody.mediaId!,
              mediaType: requestBody.mediaType,
            },
      relations: ['requests'],
    });

    if (!media) {
      if (
        requestBody.mediaType === MediaType.MUSIC ||
        requestBody.mediaType === MediaType.ARTIST ||
        requestBody.mediaType === MediaType.ALBUM
      ) {
        if (!requestBody.musicBrainzId) {
          throw new Error('MusicBrainz ID is required for music requests');
        }
        // Validate MBID format to prevent injection attacks
        if (!isValidMBID(requestBody.musicBrainzId)) {
          throw new Error('Invalid MusicBrainz ID format');
        }
        media = new Media({
          musicBrainzId: requestBody.musicBrainzId,
          status: MediaStatus.PENDING,
          mediaType: requestBody.mediaType,
        });
      } else {
        if (!tmdbMedia) {
          throw new Error('TMDB media data not found');
        }
        // TypeScript type narrowing - tmdbMedia is guaranteed non-null here
        const tmdbMediaData: NonNullable<typeof tmdbMedia> = tmdbMedia;
        media = new Media({
          tmdbId: tmdbMediaData.id,
          tvdbId: requestBody.tvdbId ?? tmdbMediaData.external_ids.tvdb_id,
          status: !requestBody.is4k ? MediaStatus.PENDING : MediaStatus.UNKNOWN,
          status4k: requestBody.is4k ? MediaStatus.PENDING : MediaStatus.UNKNOWN,
          mediaType: requestBody.mediaType,
        });
      }
    } else {
      if (
        requestBody.mediaType !== MediaType.MUSIC &&
        requestBody.mediaType !== MediaType.ARTIST &&
        requestBody.mediaType !== MediaType.ALBUM
      ) {
        if (media.status === MediaStatus.UNKNOWN && !requestBody.is4k) {
          media.status = MediaStatus.PENDING;
        }

        if (media.status4k === MediaStatus.UNKNOWN && requestBody.is4k) {
          media.status4k = MediaStatus.PENDING;
        }
      } else if (media.status === MediaStatus.UNKNOWN) {
        media.status = MediaStatus.PENDING;
      }
    }

    const existing = await requestRepository
      .createQueryBuilder('request')
      .leftJoin('request.media', 'media')
      .leftJoinAndSelect('request.requestedBy', 'user')
      .where('request.is4k = :is4k', { is4k: requestBody.is4k ?? false })
      .andWhere(
        requestBody.mediaType === MediaType.MUSIC ||
          requestBody.mediaType === MediaType.ARTIST ||
          requestBody.mediaType === MediaType.ALBUM
          ? 'media.musicBrainzId = :musicBrainzId'
          : 'media.tmdbId = :tmdbId',
        requestBody.mediaType === MediaType.MUSIC ||
          requestBody.mediaType === MediaType.ARTIST ||
          requestBody.mediaType === MediaType.ALBUM
          ? { musicBrainzId: requestBody.musicBrainzId }
          : { tmdbId: tmdbMedia?.id }
      )
      .andWhere('media.mediaType = :mediaType', {
        mediaType: requestBody.mediaType,
      })
      .getMany();

      if (existing && existing.length > 0) {
      // If there is an existing movie request that isn't declined, don't allow a new one.
      if (
        requestBody.mediaType === MediaType.MOVIE &&
        existing[0].status !== MediaRequestStatus.DECLINED &&
        existing[0].status !== MediaRequestStatus.COMPLETED
      ) {
        logger.warn('Duplicate request for media blocked', {
          tmdbId: tmdbMedia?.id,
          mediaType: requestBody.mediaType,
          is4k: requestBody.is4k,
          label: 'Media Request',
        });

        throw new DuplicateMediaRequestError(
          'Request for this media already exists.'
        );
      }

      // If there is an existing music request that isn't declined, don't allow a new one.
      if (
        (requestBody.mediaType === MediaType.MUSIC ||
          requestBody.mediaType === MediaType.ARTIST ||
          requestBody.mediaType === MediaType.ALBUM) &&
        existing[0].status !== MediaRequestStatus.DECLINED &&
        existing[0].status !== MediaRequestStatus.COMPLETED
      ) {
        logger.warn('Duplicate request for media blocked', {
          musicBrainzId: requestBody.musicBrainzId,
          mediaType: requestBody.mediaType,
          label: 'Media Request',
        });

        throw new DuplicateMediaRequestError(
          'Request for this media already exists.'
        );
      }

      // If an existing auto-request for this media exists from the same user,
      // don't allow a new one.
      if (
        existing.find(
          (r) => r.requestedBy.id === requestUser.id && r.isAutoRequest
        )
      ) {
        throw new DuplicateMediaRequestError(
          'Auto-request for this media and user already exists.'
        );
      }
    }

    // Ensure media exists before processing request - TypeScript type narrowing
    if (!media) {
      throw new Error('Media object is required but was not found or created');
    }
    // After this check, media is guaranteed to be non-null
    const mediaEntity: Media = media;

    switch (requestBody.mediaType) {
      case MediaType.MOVIE: {
        await mediaRepository.save(mediaEntity);

        const request = new MediaRequest({
          type: MediaType.MOVIE,
          media: mediaEntity,
          requestedBy: requestUser,
          // If the user is an admin or has the "auto approve" permission, automatically approve the request
          status: user.hasPermission(
            [
              requestBody.is4k
                ? Permission.AUTO_APPROVE_4K
                : Permission.AUTO_APPROVE,
              requestBody.is4k
                ? Permission.AUTO_APPROVE_4K_MOVIE
                : Permission.AUTO_APPROVE_MOVIE,
              Permission.MANAGE_REQUESTS,
            ],
            { type: 'or' }
          )
            ? MediaRequestStatus.APPROVED
            : MediaRequestStatus.PENDING,
          modifiedBy: user.hasPermission(
            [
              requestBody.is4k
                ? Permission.AUTO_APPROVE_4K
                : Permission.AUTO_APPROVE,
              requestBody.is4k
                ? Permission.AUTO_APPROVE_4K_MOVIE
                : Permission.AUTO_APPROVE_MOVIE,
              Permission.MANAGE_REQUESTS,
            ],
            { type: 'or' }
          )
            ? user
            : undefined,
          is4k: requestBody.is4k,
          serverId: requestBody.serverId,
          profileId: requestBody.profileId,
          rootFolder: requestBody.rootFolder,
          tags: requestBody.tags,
        isAutoRequest: options.isAutoRequest ?? false,
      });

        await requestRepository.save(request);
        return request;
      }
      case MediaType.TV: {
      if (!tmdbMedia) {
        throw new Error('TMDB media data not found for TV series');
      }
      const tmdbMediaShow = tmdbMedia as Awaited<
        ReturnType<typeof tmdb.getTvShow>
      >;
      const requestedSeasons =
        requestBody.seasons === 'all'
          ? tmdbMediaShow.seasons
              .filter((season) => season.season_number !== 0)
              .map((season) => season.season_number)
          : (requestBody.seasons as number[]);
      let existingSeasons: number[] = [];

      // We need to check existing requests on this title to make sure we don't double up on seasons that were
      // already requested. In the case they were, we just throw out any duplicates but still approve the request.
      // (Unless there are no seasons, in which case we abort)
      if (mediaEntity.requests) {
        existingSeasons = mediaEntity.requests
          .filter(
            (request) =>
              request.is4k === requestBody.is4k &&
              request.status !== MediaRequestStatus.DECLINED &&
              request.status !== MediaRequestStatus.COMPLETED
          )
          .reduce((seasons, request) => {
            const combinedSeasons = request.seasons.map(
              (season) => season.seasonNumber
            );

            return [...seasons, ...combinedSeasons];
          }, [] as number[]);
      }

      // We should also check seasons that are available/partially available but don't have existing requests
      if (mediaEntity.seasons) {
        existingSeasons = [
          ...existingSeasons,
          ...mediaEntity.seasons
            .filter(
              (season) =>
                season[requestBody.is4k ? 'status4k' : 'status'] !==
                  MediaStatus.UNKNOWN &&
                season[requestBody.is4k ? 'status4k' : 'status'] !==
                  MediaStatus.DELETED
            )
            .map((season) => season.seasonNumber),
        ];
      }

      const finalSeasons = requestedSeasons.filter(
        (rs) => !existingSeasons.includes(rs)
      );

      if (finalSeasons.length === 0) {
        throw new NoSeasonsAvailableError('No seasons available to request');
      } else if (
        quotas.tv.limit &&
        finalSeasons.length > (quotas.tv.remaining ?? 0)
      ) {
        throw new QuotaRestrictedError('Series Quota exceeded.');
      }

      await mediaRepository.save(mediaEntity);

      const request = new MediaRequest({
        type: MediaType.TV,
        media: mediaEntity,
        requestedBy: requestUser,
        // If the user is an admin or has the "auto approve" permission, automatically approve the request
        status: user.hasPermission(
          [
            requestBody.is4k
              ? Permission.AUTO_APPROVE_4K
              : Permission.AUTO_APPROVE,
            requestBody.is4k
              ? Permission.AUTO_APPROVE_4K_TV
              : Permission.AUTO_APPROVE_TV,
            Permission.MANAGE_REQUESTS,
          ],
          { type: 'or' }
        )
          ? MediaRequestStatus.APPROVED
          : MediaRequestStatus.PENDING,
        modifiedBy: user.hasPermission(
          [
            requestBody.is4k
              ? Permission.AUTO_APPROVE_4K
              : Permission.AUTO_APPROVE,
            requestBody.is4k
              ? Permission.AUTO_APPROVE_4K_TV
              : Permission.AUTO_APPROVE_TV,
            Permission.MANAGE_REQUESTS,
          ],
          { type: 'or' }
        )
          ? user
          : undefined,
        is4k: requestBody.is4k,
        serverId: requestBody.serverId,
        profileId: requestBody.profileId,
        rootFolder: requestBody.rootFolder,
        languageProfileId: requestBody.languageProfileId,
        tags: requestBody.tags,
        seasons: finalSeasons.map(
          (sn) =>
            new SeasonRequest({
              seasonNumber: sn,
              status: user.hasPermission(
                [
                  requestBody.is4k
                    ? Permission.AUTO_APPROVE_4K
                    : Permission.AUTO_APPROVE,
                  requestBody.is4k
                    ? Permission.AUTO_APPROVE_4K_TV
                    : Permission.AUTO_APPROVE_TV,
                  Permission.MANAGE_REQUESTS,
                ],
                { type: 'or' }
              )
                ? MediaRequestStatus.APPROVED
                : MediaRequestStatus.PENDING,
            })
        ),
        isAutoRequest: options.isAutoRequest ?? false,
      });

      await requestRepository.save(request);
      return request;
    }
    case MediaType.MUSIC:
    case MediaType.ARTIST:
    case MediaType.ALBUM: {
      if (!requestBody.musicBrainzId) {
        throw new Error('MusicBrainz ID is required for music requests');
      }

      // Media should already exist from above, but ensure it's not null
      if (!media) {
        throw new Error('Media object is missing for music request');
      }
      // TypeScript type narrowing - assert non-null after check
      const mediaEntityForMusic: Media = media as Media;

      await mediaRepository.save(mediaEntityForMusic);

      const request = new MediaRequest({
        type: requestBody.mediaType,
        media: mediaEntityForMusic,
        requestedBy: requestUser,
        status: user.hasPermission(
          [Permission.AUTO_APPROVE, Permission.MANAGE_REQUESTS],
          { type: 'or' }
        )
          ? MediaRequestStatus.APPROVED
          : MediaRequestStatus.PENDING,
        modifiedBy: user.hasPermission(
          [Permission.AUTO_APPROVE, Permission.MANAGE_REQUESTS],
          { type: 'or' }
        )
          ? user
          : undefined,
        is4k: false, // Music doesn't have 4K
        serverId: requestBody.serverId,
        profileId: requestBody.profileId,
        rootFolder: requestBody.rootFolder,
        tags: requestBody.tags,
        isAutoRequest: options.isAutoRequest ?? false,
      });

      await requestRepository.save(request);
      return request;
    }
    default: {
      // Exhaustiveness check - ensures all enum values are handled
      // If we reach here, TypeScript knows all cases are covered
      const exhaustiveCheck: never = requestBody.mediaType;
      // This will never execute, but satisfies TypeScript's return type requirement
      return Promise.reject(
        new Error(`Unsupported media type: ${exhaustiveCheck}`)
      ) as Promise<MediaRequest>;
    }
    }
  }

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

  @Column({ nullable: true })
  public metadataProfileId: number;

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

  @Column({ default: false })
  public isAutoRequest: boolean;

  constructor(init?: Partial<MediaRequest>) {
    Object.assign(this, init);
  }

  @AfterInsert()
  public async notifyNewRequest(): Promise<void> {
    if (this.status === MediaRequestStatus.PENDING) {
      const mediaRepository = getRepository(Media);
      const media = await mediaRepository.findOne({
        where: { id: this.media.id },
      });
      if (!media) {
        logger.error('Media data not found', {
          label: 'Media Request',
          requestId: this.id,
          mediaId: this.media.id,
        });
        return;
      }

      MediaRequest.sendNotification(this, media, Notification.MEDIA_PENDING);

      if (this.isAutoRequest) {
        MediaRequest.sendNotification(
          this,
          media,
          Notification.MEDIA_AUTO_REQUESTED
        );
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
        logger.error('Media data not found', {
          label: 'Media Request',
          requestId: this.id,
          mediaId: this.media.id,
        });
        return;
      }

      if (media[this.is4k ? 'status4k' : 'status'] === MediaStatus.AVAILABLE) {
        logger.warn(
          'Media became available before request was approved. Skipping approval notification',
          { label: 'Media Request', requestId: this.id, mediaId: this.media.id }
        );
        return;
      }

      MediaRequest.sendNotification(
        this,
        media,
        this.status === MediaRequestStatus.APPROVED
          ? autoApproved
            ? Notification.MEDIA_AUTO_APPROVED
            : Notification.MEDIA_APPROVED
          : Notification.MEDIA_DECLINED
      );

      if (
        this.status === MediaRequestStatus.APPROVED &&
        autoApproved &&
        this.isAutoRequest
      ) {
        MediaRequest.sendNotification(
          this,
          media,
          Notification.MEDIA_AUTO_REQUESTED
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

  static async sendNotification(
    entity: MediaRequest,
    media: Media,
    type: Notification
  ) {
    const tmdb = new TheMovieDb();
    const musicBrainz = new MusicBrainzAPI();

    try {
      let mediaType: string;
      if (entity.type === MediaType.MOVIE) {
        mediaType = 'Movie';
      } else if (entity.type === MediaType.TV) {
        mediaType = 'Series';
      } else if (entity.type === MediaType.ARTIST) {
        mediaType = 'Artist';
      } else if (entity.type === MediaType.ALBUM) {
        mediaType = 'Album';
      } else {
        mediaType = 'Media';
      }

      let event: string | undefined;
      let notifyAdmin = true;
      let notifySystem = true;

      switch (type) {
        case Notification.MEDIA_APPROVED:
          event = `${entity.is4k ? '4K ' : ''}${mediaType} Request Approved`;
          notifyAdmin = false;
          break;
        case Notification.MEDIA_DECLINED:
          event = `${entity.is4k ? '4K ' : ''}${mediaType} Request Declined`;
          notifyAdmin = false;
          break;
        case Notification.MEDIA_PENDING:
          event = `New ${entity.is4k ? '4K ' : ''}${mediaType} Request`;
          break;
        case Notification.MEDIA_AUTO_REQUESTED:
          event = `${
            entity.is4k ? '4K ' : ''
          }${mediaType} Request Automatically Submitted`;
          notifyAdmin = false;
          notifySystem = false;
          break;
        case Notification.MEDIA_AUTO_APPROVED:
          event = `${
            entity.is4k ? '4K ' : ''
          }${mediaType} Request Automatically Approved`;
          break;
        case Notification.MEDIA_FAILED:
          event = `${entity.is4k ? '4K ' : ''}${mediaType} Request Failed`;
          break;
      }

      if (entity.type === MediaType.MOVIE) {
        if (!media.tmdbId) {
          logger.warn('Movie request missing TMDB ID', {
            label: 'Media Request',
            requestId: entity.id,
            mediaId: media.id,
          });
          return;
        }
        const tmdbId = media.tmdbId;
        const movie = await tmdb.getMovie({ movieId: tmdbId });
        notificationManager.sendNotification(type, {
          media,
          request: entity,
          notifyAdmin,
          notifySystem,
          notifyUser: notifyAdmin ? undefined : entity.requestedBy,
          event,
          subject: `${movie.title}${
            movie.release_date ? ` (${movie.release_date.slice(0, 4)})` : ''
          }`,
          message: truncate(movie.overview, {
            length: 500,
            separator: /\s/,
            omission: '…',
          }),
          image: `https://image.tmdb.org/t/p/w600_and_h900_bestv2${movie.poster_path}`,
        });
      } else if (entity.type === MediaType.TV) {
        if (!media.tmdbId) {
          logger.warn('TV request missing TMDB ID', {
            label: 'Media Request',
            requestId: entity.id,
            mediaId: media.id,
          });
          return;
        }
        const tmdbId = media.tmdbId;
        const tv = await tmdb.getTvShow({ tvId: tmdbId });
        notificationManager.sendNotification(type, {
          media,
          request: entity,
          notifyAdmin,
          notifySystem,
          notifyUser: notifyAdmin ? undefined : entity.requestedBy,
          event,
          subject: `${tv.name}${
            tv.first_air_date ? ` (${tv.first_air_date.slice(0, 4)})` : ''
          }`,
          message: truncate(tv.overview, {
            length: 500,
            separator: /\s/,
            omission: '…',
          }),
          image: `https://image.tmdb.org/t/p/w600_and_h900_bestv2${tv.poster_path}`,
          extra: [
            {
              name: 'Requested Seasons',
              value: entity.seasons
                .map((season) => season.seasonNumber)
                .join(', '),
            },
          ],
        });
      } else if (
        entity.type === MediaType.ARTIST ||
        entity.type === MediaType.ALBUM
      ) {
        if (!media.musicBrainzId) {
          logger.warn('Music request missing MusicBrainz ID', {
            label: 'Media Request',
            requestId: entity.id,
            mediaId: media.id,
          });
          return;
        }

        try {
          let subject: string;
          let image: string | undefined;

          if (entity.type === MediaType.ARTIST) {
            const artist = await musicBrainz.getArtist(media.musicBrainzId);
            subject = artist.name;
            // MusicBrainz doesn't provide images directly, use placeholder
            image = undefined;
          } else {
            const releaseGroup = await musicBrainz.getReleaseGroup(
              media.musicBrainzId
            );
            subject = releaseGroup.title;
            // MusicBrainz doesn't provide images directly, use placeholder
            image = undefined;
          }

          notificationManager.sendNotification(type, {
            media,
            request: entity,
            notifyAdmin,
            notifySystem,
            notifyUser: notifyAdmin ? undefined : entity.requestedBy,
            event,
            subject,
            message: '',
            image,
          });
        } catch (e) {
          logger.error('Failed to fetch music data for notification', {
            label: 'Media Request',
            errorMessage: e.message,
            requestId: entity.id,
            mediaId: media.id,
            musicBrainzId: media.musicBrainzId,
          });
          // Send notification anyway with basic info
          notificationManager.sendNotification(type, {
            media,
            request: entity,
            notifyAdmin,
            notifySystem,
            notifyUser: notifyAdmin ? undefined : entity.requestedBy,
            event,
            subject:
              entity.type === MediaType.ARTIST ? 'Artist' : 'Album',
            message: '',
          });
        }
      }
    } catch (e) {
      logger.error('Something went wrong sending media notification(s)', {
        label: 'Notifications',
        errorMessage: e.message,
        requestId: entity.id,
        mediaId: entity.media.id,
      });
    }
  }
}

export default MediaRequest;
