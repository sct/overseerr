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

  private async updateRelatedMediaRequest(event: Media, is4k: boolean) {
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

      relatedRequests.forEach((request) => {
        let shouldComplete = false;

        if (
          event[request.is4k ? 'status4k' : 'status'] ===
            MediaStatus.AVAILABLE ||
          event[request.is4k ? 'status4k' : 'status'] === MediaStatus.DELETED
        ) {
          shouldComplete = true;
        } else if (event.mediaType === 'tv') {
          // For TV, check if all requested seasons are available or deleted
          const allSeasonsReady = request.seasons.every((requestSeason) => {
            const matchingSeason = event.seasons.find(
              (mediaSeason) =>
                mediaSeason.seasonNumber === requestSeason.seasonNumber
            );

            if (!matchingSeason) {
              return false;
            }

            return (
              matchingSeason[request.is4k ? 'status4k' : 'status'] ===
                MediaStatus.AVAILABLE ||
              matchingSeason[request.is4k ? 'status4k' : 'status'] ===
                MediaStatus.DELETED
            );
          });

          shouldComplete = allSeasonsReady;
        }

        if (shouldComplete) {
          request.status = MediaRequestStatus.COMPLETED;
          completedRequests.push(request);
        }
      });

      await requestRepository.save(completedRequests);

      // Handle season requests and mark them completed when
      // that specific season becomes available
      if (event.mediaType === 'tv') {
        const seasonsToUpdate = relatedRequests.flatMap((request) => {
          return request.seasons.filter((requestSeason) => {
            const matchingSeason = event.seasons.find(
              (mediaSeason) =>
                mediaSeason.seasonNumber === requestSeason.seasonNumber
            );

            if (!matchingSeason) {
              return false;
            }

            return (
              matchingSeason[request.is4k ? 'status4k' : 'status'] ===
                MediaStatus.AVAILABLE ||
              matchingSeason[request.is4k ? 'status4k' : 'status'] ===
                MediaStatus.DELETED
            );
          });
        });

        await Promise.all(
          seasonsToUpdate.map((season) =>
            seasonRequestRepository.update(season.id, {
              status: MediaRequestStatus.COMPLETED,
            })
          )
        );
      }
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
          previousSeason[is4k ? 'status4k' : 'status']
        );
      });
    };

    if (
      (event.entity.status !== event.databaseEntity?.status ||
        (event.entity.mediaType === MediaType.TV &&
          seasonStatusCheck(false))) &&
      validStatuses.includes(event.entity.status)
    ) {
      this.updateRelatedMediaRequest(event.entity as Media, false);
    }

    if (
      (event.entity.status4k !== event.databaseEntity?.status4k ||
        (event.entity.mediaType === MediaType.TV && seasonStatusCheck(true))) &&
      validStatuses.includes(event.entity.status4k)
    ) {
      this.updateRelatedMediaRequest(event.entity as Media, true);
    }
  }

  public listenTo(): typeof Media {
    return Media;
  }
}
