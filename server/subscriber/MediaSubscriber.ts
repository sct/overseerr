import SonarrAPI from '@server/api/servarr/sonarr';
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
import { getSettings } from '@server/lib/settings';
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

  private async notifyRequestCaughtUp(
    request: MediaRequest,
    is4k: boolean
  ) {
    if (request.partialAvailabilityNotified) {
      return;
    }

    const media = request.media;
    const serviceId = media[is4k ? 'serviceId4k' : 'serviceId'];
    const externalServiceId = media[is4k ? 'externalServiceId4k' : 'externalServiceId'];

    if (serviceId === null || serviceId === undefined) {
      return;
    }

    if (externalServiceId === null || externalServiceId === undefined) {
      return;
    }

    const settings = getSettings();
    const sonarrSettings = settings.sonarr.find(
      (sonarr) => sonarr.id === serviceId
    );

    if (!sonarrSettings) {
      return;
    }

    try {
      const sonarr = new SonarrAPI({
        apiKey: sonarrSettings.apiKey,
        url: SonarrAPI.buildUrl(sonarrSettings, '/api/v3'),
      });

      const series = await sonarr.getSeriesById(externalServiceId);

      let hasAiredEpisodes = false;

      const allCaughtUp = request.seasons.every((seasonRequest) => {
        if (seasonRequest.seasonNumber === 0) {
          return true;
        }

        const sonarrSeason = series.seasons.find(
          (season) => season.seasonNumber === seasonRequest.seasonNumber
        );

        if (!sonarrSeason?.statistics) {
          return false;
        }

        const { episodeCount = 0, episodeFileCount = 0 } =
          sonarrSeason.statistics;

        if (episodeCount === 0) {
          return true;
        }

        hasAiredEpisodes = true;

        return episodeFileCount >= episodeCount;
      });

      if (!hasAiredEpisodes || !allCaughtUp) {
        return;
      }

      const tmdb = new TheMovieDb();
      const tv = await tmdb.getTvShow({ tvId: media.tmdbId });

      if (!tv.in_production && tv.status !== 'Returning Series') {
        return;
      }

      const requestedSeasonNumbers = request.seasons
        .map((season) => season.seasonNumber)
        .filter((seasonNumber) => seasonNumber !== 0)
        .sort((a, b) => a - b);

      notificationManager.sendNotification(Notification.MEDIA_AVAILABLE, {
        event: `${is4k ? '4K ' : ''}Series Request Now Available`,
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
        media,
        extra:
          requestedSeasonNumbers.length > 0
            ? [
                {
                  name: 'Requested Seasons',
                  value: requestedSeasonNumbers.join(', '),
                },
              ]
            : undefined,
        request,
      });

      const requestRepository = getRepository(MediaRequest);
      request.partialAvailabilityNotified = true;
      await requestRepository.save(request);
    } catch (e) {
      logger.error('Unable to send catch-up notification', {
        label: 'Notifications',
        errorMessage: (e as Error).message,
        mediaId: request.media.id,
        requestId: request.id,
      });
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

              const shouldUpdate =
                (currentSeasonStatus !== previousSeasonStatus ||
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
        } else if (event.mediaType === MediaType.TV) {
          await this.notifyRequestCaughtUp(request, is4k);
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
