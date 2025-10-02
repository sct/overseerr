import TheMovieDb from '@server/api/themoviedb';
import {
  MediaRequestStatus,
  MediaStatus,
  MediaType,
} from '@server/constants/media';
import { getRepository } from '@server/datasource';
import Media from '@server/entity/Media';
import { MediaRequest } from '@server/entity/MediaRequest';
import Season from '@server/entity/Season';
import SeasonRequest from '@server/entity/SeasonRequest';
import notificationManager, { Notification } from '@server/lib/notifications';
import logger from '@server/logger';
import { truncate } from 'lodash';
import type { EntitySubscriberInterface, UpdateEvent } from 'typeorm';
import { EventSubscriber } from 'typeorm';

@EventSubscriber()
export class MediaSubscriber implements EntitySubscriberInterface<Media> {
  private async updateChildRequestStatus(event: Media, is4k: boolean) {
    const requestRepository = getRepository(MediaRequest);

    const requests = await requestRepository.find({
      where: { media: { id: event.id } },
    });

    for (const request of requests) {
      if (
        request.is4k === is4k &&
        request.status === MediaRequestStatus.PENDING
      ) {
        request.status = MediaRequestStatus.APPROVED;
        await requestRepository.save(request);
      }
    }
  }

  private async notifyPartiallyAvailable(
    request: MediaRequest,
    seasons: number[],
    is4k: boolean
  ) {
    if (seasons.length === 0) {
      return;
    }

    const tmdb = new TheMovieDb();

    try {
      const tv = await tmdb.getTvShow({ tvId: request.media.tmdbId });

      if (!tv.inProduction && tv.status !== 'Returning Series') {
        return;
      }

      const updatedSeasons = [...seasons].sort((a, b) => a - b).join(', ');
      const requestedSeasons = request.seasons
        ?.map((season) => season.seasonNumber)
        .sort((a, b) => a - b)
        .join(', ');

      notificationManager.sendNotification(
        Notification.MEDIA_PARTIALLY_AVAILABLE,
        {
          event: `${is4k ? '4K ' : ''}Series Request Updated`,
          subject: `${tv.name}${
            tv.first_air_date ? ` (${tv.first_air_date.slice(0, 4)})` : ''
          }`,
          message: truncate(tv.overview, {
            length: 500,
            separator: /\s/,
            omission: '…',
          }),
          notifyAdmin: false,
          notifySystem: true,
          notifyUser: request.requestedBy,
          image: tv.poster_path
            ? `https://image.tmdb.org/t/p/w600_and_h900_bestv2${tv.poster_path}`
            : undefined,
          media: request.media,
          extra: [
            {
              name: 'Updated Seasons',
              value: updatedSeasons,
            },
            ...(requestedSeasons
              ? [
                  {
                    name: 'Requested Seasons',
                    value: requestedSeasons,
                  },
                ]
              : []),
          ],
          request,
        }
      );
    } catch (e) {
      logger.error(
        'Something went wrong sending partial availability notification',
        {
          label: 'Notifications',
          errorMessage: (e as Error).message,
          mediaId: request.media.id,
          requestId: request.id,
        }
      );
    }
  }

  private async updateRelatedMediaRequest(
    event: Media,
    databaseEvent: Media,
    is4k: boolean
  ) {
    const requestRepository = getRepository(MediaRequest);
    const seasonRequestRepository = getRepository(SeasonRequest);

    const relatedRequests = await requestRepository.find({
      relations: {
        media: true,
      },
      where: {
        media: { id: event.id },
        status: MediaRequestStatus.APPROVED,
        is4k,
      },
    });

    // Check the media entity status and if available
    // or deleted, set the related request to completed
    if (relatedRequests.length > 0) {
      const completedRequests: MediaRequest[] = [];

      for (const request of relatedRequests) {
        let shouldComplete = false;
        const partialSeasonUpdates: number[] = [];

        if (
          (event[request.is4k ? 'status4k' : 'status'] ===
            MediaStatus.AVAILABLE ||
            event[request.is4k ? 'status4k' : 'status'] ===
              MediaStatus.DELETED) &&
          event.mediaType === MediaType.MOVIE
        ) {
          shouldComplete = true;
        } else if (event.mediaType === 'tv') {
          const allSeasonResults = await Promise.all(
            request.seasons.map(async (requestSeason) => {
              const matchingSeason = event.seasons.find(
                (mediaSeason) =>
                  mediaSeason.seasonNumber === requestSeason.seasonNumber
              );
              const matchingOldSeason = databaseEvent.seasons.find(
                (oldSeason) =>
                  oldSeason.seasonNumber === requestSeason.seasonNumber
              );

              if (!matchingSeason) {
                return false;
              }

              const currentSeasonStatus =
                matchingSeason[request.is4k ? 'status4k' : 'status'];
              const previousSeasonStatus =
                matchingOldSeason?.[request.is4k ? 'status4k' : 'status'];

              const hasStatusChanged =
                currentSeasonStatus !== previousSeasonStatus;

              if (
                hasStatusChanged &&
                currentSeasonStatus === MediaStatus.PARTIALLY_AVAILABLE &&
                requestSeason.status !== MediaRequestStatus.COMPLETED
              ) {
                partialSeasonUpdates.push(requestSeason.seasonNumber);
              }

              const shouldUpdate =
                (hasStatusChanged ||
                  requestSeason.status === MediaRequestStatus.COMPLETED) &&
                (currentSeasonStatus === MediaStatus.AVAILABLE ||
                  currentSeasonStatus === MediaStatus.DELETED);

              if (shouldUpdate) {
                requestSeason.status = MediaRequestStatus.COMPLETED;
                await seasonRequestRepository.save(requestSeason);

                return true;
              }

              return false;
            })
          );

          const allSeasonsReady = allSeasonResults.every((result) => result);
          shouldComplete = allSeasonsReady;
        }

        if (shouldComplete) {
          request.status = MediaRequestStatus.COMPLETED;
          completedRequests.push(request);
        } else if (partialSeasonUpdates.length > 0) {
          await this.notifyPartiallyAvailable(
            request,
            partialSeasonUpdates,
            is4k
          );
        }
      }

      await requestRepository.save(completedRequests);
    }
  }

  public async beforeUpdate(event: UpdateEvent<Media>): Promise<void> {
    if (!event.entity) {
      return;
    }

    if (
      event.entity.status === MediaStatus.AVAILABLE &&
      event.databaseEntity.status === MediaStatus.PENDING
    ) {
      this.updateChildRequestStatus(event.entity as Media, false);
    }

    if (
      event.entity.status4k === MediaStatus.AVAILABLE &&
      event.databaseEntity.status4k === MediaStatus.PENDING
    ) {
      this.updateChildRequestStatus(event.entity as Media, true);
    }

    // Manually load related seasons into databaseEntity
    // for seasonStatusCheck in afterUpdate
    const seasons = await event.manager
      .getRepository(Season)
      .createQueryBuilder('season')
      .leftJoin('season.media', 'media')
      .where('media.id = :id', { id: event.databaseEntity.id })
      .getMany();

    event.databaseEntity.seasons = seasons;
  }

  public async afterUpdate(event: UpdateEvent<Media>): Promise<void> {
    if (!event.entity) {
      return;
    }

    const validStatuses = [
      MediaStatus.PARTIALLY_AVAILABLE,
      MediaStatus.AVAILABLE,
      MediaStatus.DELETED,
    ];

    const seasonStatusCheck = (is4k: boolean) => {
      return event.entity?.seasons?.some((season: Season, index: number) => {
        const previousSeason = event.databaseEntity.seasons[index];

        return (
          season[is4k ? 'status4k' : 'status'] !==
          previousSeason?.[is4k ? 'status4k' : 'status']
        );
      });
    };

    if (
      (event.entity.status !== event.databaseEntity?.status ||
        (event.entity.mediaType === MediaType.TV &&
          seasonStatusCheck(false))) &&
      validStatuses.includes(event.entity.status)
    ) {
      this.updateRelatedMediaRequest(
        event.entity as Media,
        event.databaseEntity as Media,
        false
      );
    }

    if (
      (event.entity.status4k !== event.databaseEntity?.status4k ||
        (event.entity.mediaType === MediaType.TV && seasonStatusCheck(true))) &&
      validStatuses.includes(event.entity.status4k)
    ) {
      this.updateRelatedMediaRequest(
        event.entity as Media,
        event.databaseEntity as Media,
        true
      );
    }
  }

  public listenTo(): typeof Media {
    return Media;
  }
}
