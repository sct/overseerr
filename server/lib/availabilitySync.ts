import type { PlexMetadata } from '@server/api/plexapi';
import PlexAPI from '@server/api/plexapi';
import RadarrAPI, { type RadarrMovie } from '@server/api/servarr/radarr';
import type { SonarrSeason, SonarrSeries } from '@server/api/servarr/sonarr';
import SonarrAPI from '@server/api/servarr/sonarr';
import { MediaRequestStatus, MediaStatus } from '@server/constants/media';
import { getRepository } from '@server/datasource';
import Media from '@server/entity/Media';
import MediaRequest from '@server/entity/MediaRequest';
import type Season from '@server/entity/Season';
import SeasonRequest from '@server/entity/SeasonRequest';
import { User } from '@server/entity/User';
import type { RadarrSettings, SonarrSettings } from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';

class AvailabilitySync {
  public running = false;
  private plexClient: PlexAPI;
  private plexSeasonsCache: Record<string, PlexMetadata[]> = {};
  private sonarrSeasonsCache: Record<string, SonarrSeason[]> = {};
  private radarrServers: RadarrSettings[];
  private sonarrServers: SonarrSettings[];

  async run() {
    const settings = getSettings();
    this.running = true;
    this.radarrServers = settings.radarr.filter((server) => server.syncEnabled);
    this.sonarrServers = settings.sonarr.filter((server) => server.syncEnabled);

    try {
      logger.info(`Starting availability sync...`, {
        label: 'AvailabilitySync',
      });
      const pageSize = 50;

      const userRepository = getRepository(User);
      const admin = await userRepository.findOne({
        select: { id: true, plexToken: true },
        where: { id: 1 },
      });

      if (admin) {
        this.plexClient = new PlexAPI({ plexToken: admin.plexToken });
      } else {
        logger.error('An admin is not configured.');
      }

      for await (const media of this.loadAvailableMediaPaginated(pageSize)) {
        if (!this.running) {
          throw new Error('Job aborted');
        }

        // Check plex, radarr, and sonarr for that specific media and
        // if unavailable, then we change the status accordingly.
        // If a non-4k or 4k version exists in at least one of the instances, we will only update that specific version
        if (media.mediaType === 'movie') {
          let movieExists = false;
          let movieExists4k = false;
          const [existsInPlex, existsInPlex4k] = [
            await this.mediaExistsInPlex(media, false),
            await this.mediaExistsInPlex(media, true),
          ];
          const [existsInRadarr, existsInRadarr4k] = [
            await this.mediaExistsInRadarr(media, false),
            await this.mediaExistsInRadarr(media, true),
          ];

          if (existsInPlex || existsInRadarr) {
            movieExists = true;
            logger.info(
              `The non-4K movie with TMDB ID ${media.tmdbId} still exists. Preventing removal.`,
              {
                label: 'AvailabilitySync',
              }
            );
          }

          if (existsInPlex4k || existsInRadarr4k) {
            movieExists4k = true;
            logger.info(
              `The 4K movie with TMDB ID ${media.tmdbId} still exists. Preventing removal.`,
              {
                label: 'AvailabilitySync',
              }
            );
          }

          if (!movieExists && media.status === MediaStatus.AVAILABLE) {
            this.mediaUpdater(media, false);
          }

          if (!movieExists4k && media.status4k === MediaStatus.AVAILABLE) {
            this.mediaUpdater(media, true);
          }
        }

        // If both versions still exist in plex, we still need
        // to check through sonarr to verify season availability
        if (media.mediaType === 'tv') {
          let showExists = false;
          let showExists4k = false;
          const [
            [existsInPlex, plexSeasonMap],
            [existsInPlex4k, plexSeasonMap4k],
          ] = [
            await this.mediaExistsInPlex(media, false),
            await this.mediaExistsInPlex(media, true),
          ];
          const [
            [existsInSonarr, sonarrSeasonMap],
            [existsInSonarr4k, sonarrSeasonMap4k],
          ] = [
            await this.mediaExistsInSonarr(media, false),
            await this.mediaExistsInSonarr(media, true),
          ];
          if (existsInPlex || existsInSonarr) {
            showExists = true;
            logger.info(
              `The non-4K show with TMDB ID ${media.tmdbId} still exists. Preventing removal.`,
              {
                label: 'AvailabilitySync',
              }
            );
          }

          if (existsInPlex4k || existsInSonarr4k) {
            showExists4k = true;
            logger.info(
              `The 4K show with TMDB ID ${media.tmdbId} still exists. Preventing removal.`,
              {
                label: 'AvailabilitySync',
              }
            );
          }

          const filteredSeasonsMap: Record<number, boolean> = {};

          media.seasons
            .filter(
              (season) =>
                season.status === MediaStatus.AVAILABLE ||
                season.status === MediaStatus.PARTIALLY_AVAILABLE
            )
            .forEach(
              (season) => (filteredSeasonsMap[season.seasonNumber] = false)
            );

          const finalSeasons = {
            ...filteredSeasonsMap,
            ...plexSeasonMap,
            ...sonarrSeasonMap,
          };

          const filteredSeasonsMap4k: Record<number, boolean> = {};

          media.seasons
            .filter(
              (season) =>
                season.status4k === MediaStatus.AVAILABLE ||
                season.status4k === MediaStatus.PARTIALLY_AVAILABLE
            )
            .forEach(
              (season) => (filteredSeasonsMap4k[season.seasonNumber] = false)
            );

          const finalSeasons4k = {
            ...filteredSeasonsMap4k,
            ...plexSeasonMap4k,
            ...sonarrSeasonMap4k,
          };

          if (Object.values(finalSeasons).some((season) => !season)) {
            await this.seasonUpdater(media, finalSeasons, false);
          }

          if (Object.values(finalSeasons4k).some((season) => !season)) {
            await this.seasonUpdater(media, finalSeasons4k, true);
          }

          if (
            !showExists &&
            (media.status === MediaStatus.AVAILABLE ||
              media.status === MediaStatus.PARTIALLY_AVAILABLE)
          ) {
            this.mediaUpdater(media, false);
          }

          if (
            !showExists4k &&
            (media.status4k === MediaStatus.AVAILABLE ||
              media.status4k === MediaStatus.PARTIALLY_AVAILABLE)
          ) {
            this.mediaUpdater(media, true);
          }
        }
      }
    } catch (ex) {
      logger.error('Failed to complete availability sync.', {
        errorMessage: ex.message,
        label: 'AvailabilitySync',
      });
    } finally {
      logger.info(`Availability sync complete.`, {
        label: 'AvailabilitySync',
      });
      this.running = false;
    }
  }

  public cancel() {
    this.running = false;
  }

  private async *loadAvailableMediaPaginated(pageSize: number) {
    let offset = 0;
    const mediaRepository = getRepository(Media);
    const whereOptions = [
      { status: MediaStatus.AVAILABLE },
      { status: MediaStatus.PARTIALLY_AVAILABLE },
      { status4k: MediaStatus.AVAILABLE },
      { status4k: MediaStatus.PARTIALLY_AVAILABLE },
    ];

    let mediaPage: Media[];

    do {
      yield* (mediaPage = await mediaRepository.find({
        where: whereOptions,
        skip: offset,
        take: pageSize,
      }));
      offset += pageSize;
    } while (mediaPage.length > 0);
  }

  private findMediaStatus(
    requests: MediaRequest[],
    is4k: boolean
  ): MediaStatus {
    const filteredRequests = requests.filter(
      (request) => request.is4k === is4k
    );

    let mediaStatus: MediaStatus;

    if (
      filteredRequests.some(
        (request) => request.status === MediaRequestStatus.APPROVED
      )
    ) {
      mediaStatus = MediaStatus.PROCESSING;
    } else if (
      filteredRequests.some(
        (request) => request.status === MediaRequestStatus.PENDING
      )
    ) {
      mediaStatus = MediaStatus.PENDING;
    } else {
      mediaStatus = MediaStatus.UNKNOWN;
    }

    return mediaStatus;
  }

  private async mediaUpdater(media: Media, is4k: boolean): Promise<void> {
    const mediaRepository = getRepository(Media);
    const requestRepository = getRepository(MediaRequest);

    try {
      // Find all related requests only if
      // the related media has an available status
      const requests = await requestRepository
        .createQueryBuilder('request')
        .leftJoinAndSelect('request.media', 'media')
        .where('(media.id = :id)', {
          id: media.id,
        })
        .andWhere(
          `(request.is4k = :is4k AND media.${
            is4k ? 'status4k' : 'status'
          } IN (:...mediaStatus))`,
          {
            mediaStatus: [
              MediaStatus.AVAILABLE,
              MediaStatus.PARTIALLY_AVAILABLE,
            ],
            is4k: is4k,
          }
        )
        .getMany();

      // Check if a season is processing or pending to
      // make sure we set the media to the correct status
      let mediaStatus = MediaStatus.UNKNOWN;

      if (media.mediaType === 'tv') {
        mediaStatus = this.findMediaStatus(requests, is4k);
      }

      (media[is4k ? 'status4k' : 'status'] = mediaStatus),
        (media[is4k ? 'serviceId4k' : 'serviceId'] =
          mediaStatus === MediaStatus.PROCESSING
            ? media[is4k ? 'serviceId4k' : 'serviceId']
            : null),
        (media[is4k ? 'externalServiceId4k' : 'externalServiceId'] =
          mediaStatus === MediaStatus.PROCESSING
            ? media[is4k ? 'externalServiceId4k' : 'externalServiceId']
            : null),
        (media[is4k ? 'externalServiceSlug4k' : 'externalServiceSlug'] =
          mediaStatus === MediaStatus.PROCESSING
            ? media[is4k ? 'externalServiceSlug4k' : 'externalServiceSlug']
            : null),
        (media[is4k ? 'ratingKey4k' : 'ratingKey'] =
          mediaStatus === MediaStatus.PROCESSING
            ? media[is4k ? 'ratingKey4k' : 'ratingKey']
            : null);
      logger.info(
        `The ${media.mediaType === 'tv' ? 'show' : 'movie'} with TMDB ID ${
          media.tmdbId
        } does not exist in your ${is4k ? '4K' : 'non-4K'} ${
          media.mediaType === 'tv' ? 'Sonarr' : 'Radarr'
        } and Plex instance. Status will be changed to unknown.`,
        { label: 'AvailabilitySync' }
      );

      await mediaRepository.save({ media, ...media });

      // Only delete media request if type is movie.
      // Type tv request deletion is handled
      // in the season request entity
      if (requests.length > 0 && media.mediaType === 'movie') {
        await requestRepository.remove(requests);
      }
    } catch (ex) {
      logger.debug(
        `Failure updating the ${
          media.mediaType === 'tv' ? 'show' : 'movie'
        } with TMDB ID ${media.tmdbId}.`,
        {
          errorMessage: ex.message,
          label: 'AvailabilitySync',
        }
      );
    }
  }

  private async seasonUpdater(
    media: Media,
    seasons: Record<number, boolean>,
    is4k: boolean
  ): Promise<void> {
    const mediaRepository = getRepository(Media);
    const seasonRequestRepository = getRepository(SeasonRequest);

    try {
      const seasonsPendingRemoval = Object.fromEntries(
        // Disabled linter as only the value is needed from the filter
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        Object.entries(seasons).filter(([_, exists]) => !exists)
      );

      const seasonRequests = await seasonRequestRepository
        .createQueryBuilder('seasonRequest')
        .leftJoinAndSelect('seasonRequest.request', 'request')
        .leftJoinAndSelect('request.media', 'media')
        .where('(media.id = :id)', { id: media.id })
        .andWhere(
          '(request.is4k = :is4k AND seasonRequest.seasonNumber IN (:...seasonNumbers))',
          {
            seasonNumbers: Object.keys(seasonsPendingRemoval),
            is4k: is4k,
          }
        )
        .getMany();

      for (const mediaSeason of media.seasons) {
        Object.keys(seasonsPendingRemoval).forEach((season) => {
          if (Number(season) === mediaSeason.seasonNumber) {
            mediaSeason[is4k ? 'status4k' : 'status'] = MediaStatus.UNKNOWN;
          }
        });
      }

      if (media.status === MediaStatus.AVAILABLE) {
        media.status = MediaStatus.PARTIALLY_AVAILABLE;
        logger.info(
          `Marking the non-4K show with TMDB ID ${media.tmdbId} as PARTIALLY_AVAILABLE because season removal has occurred.`,
          { label: 'AvailabilitySync' }
        );
      }

      if (media.status4k === MediaStatus.AVAILABLE) {
        media.status4k = MediaStatus.PARTIALLY_AVAILABLE;
        logger.info(
          `Marking the 4K show with TMDB ID ${media.tmdbId} as PARTIALLY_AVAILABLE because season removal has occurred.`,
          { label: 'AvailabilitySync' }
        );
      }

      mediaRepository.save({ media, ...media });

      if (seasonRequests.length > 0) {
        seasonRequestRepository.remove(seasonRequests);
      }

      logger.info(
        `Updating season(s) [${Object.keys(seasons)}], TMDB ID ${
          media.tmdbId
        }, as they do not exist in your 4K ${
          media.mediaType === 'tv' ? 'Sonarr' : 'Radarr'
        } and Plex instance. Status will be changed to unknown.`,
        { label: 'AvailabilitySync' }
      );
    } catch (ex) {
      logger.debug(
        `Failure updating season(s) [${Object.keys(seasons)}], TMDB ID ${
          media.tmdbId
        }.`,
        {
          errorMessage: ex.message,
          label: 'AvailabilitySync',
        }
      );
    }
  }

  private async mediaExistsInRadarr(
    media: Media,
    is4k: boolean
  ): Promise<boolean> {
    let existsInRadarr = false;

    // Check for availability in all of the available radarr servers
    // If any find the media, we will assume the media exists
    for (const server of this.radarrServers) {
      const radarrAPI = new RadarrAPI({
        apiKey: server.apiKey,
        url: RadarrAPI.buildUrl(server, '/api/v3'),
      });

      try {
        let radarr: RadarrMovie | undefined;

        if (server.is4k === is4k && media.externalServiceId) {
          radarr = await radarrAPI.getMovie({
            id: media.externalServiceId,
          });
        }

        if (server.is4k === is4k && media.externalServiceId4k) {
          radarr = await radarrAPI.getMovie({
            id: media.externalServiceId4k,
          });
        }

        if (radarr && radarr.hasFile) {
          existsInRadarr = true;
        }
      } catch (ex) {
        if (!ex.message.includes('404')) {
          existsInRadarr = true;
          logger.debug(
            `Failure retrieving the movie with TMDB ID ${
              media.tmdbId
            } from your ${is4k ? '4K' : 'non-4K'} Radarr.`,
            {
              errorMessage: ex.message,
              label: 'AvailabilitySync',
            }
          );
        }
      }
    }

    return existsInRadarr;
  }

  private async mediaExistsInSonarr(
    media: Media,
    is4k: boolean
  ): Promise<[boolean, Record<number, boolean>]> {
    let existsInSonarr = false;
    let preventSeasonSearch = false;

    // Check for availability in all of the available sonarr servers
    // If any find the media, we will assume the media exists
    for (const server of this.sonarrServers) {
      const sonarrAPI = new SonarrAPI({
        apiKey: server.apiKey,
        url: SonarrAPI.buildUrl(server, '/api/v3'),
      });

      try {
        let sonarr: SonarrSeries | undefined;

        if (server.is4k === is4k && media.externalServiceId) {
          sonarr = await sonarrAPI.getSeriesById(media.externalServiceId);
          this.sonarrSeasonsCache[`${server.id}-${media.externalServiceId}`] =
            sonarr.seasons;
        }

        if (server.is4k === is4k && media.externalServiceId4k) {
          sonarr = await sonarrAPI.getSeriesById(media.externalServiceId4k);
          this.sonarrSeasonsCache[`${server.id}-${media.externalServiceId4k}`] =
            sonarr.seasons;
        }

        if (sonarr && sonarr.statistics.episodeFileCount > 0) {
          existsInSonarr = true;
        }
      } catch (ex) {
        if (!ex.message.includes('404')) {
          existsInSonarr = true;
          preventSeasonSearch = true;
          logger.debug(
            `Failure retrieving the show with TMDB ID ${
              media.tmdbId
            } from your ${is4k ? '4K' : 'non-4K'} Sonarr.`,
            {
              errorMessage: ex.message,
              label: 'AvailabilitySync',
            }
          );
        }
      }
    }

    // Here we check each season for availability
    // If the API returns an error other than a 404,
    // we will have to prevent the season check from happening
    const sonarrSeasonMap: Record<number, boolean> = {};

    if (!preventSeasonSearch) {
      media.seasons
        .filter(
          (season) =>
            season[is4k ? 'status4k' : 'status'] === MediaStatus.AVAILABLE ||
            season[is4k ? 'status4k' : 'status'] ===
              MediaStatus.PARTIALLY_AVAILABLE
        )
        .forEach(async (season) => {
          const seasonExists = await this.seasonExistsInSonarr(
            media,
            season,
            is4k
          );

          if (seasonExists) {
            sonarrSeasonMap[season.seasonNumber] = true;
          }
        });
    }

    return [existsInSonarr, sonarrSeasonMap];
  }

  private async seasonExistsInSonarr(
    media: Media,
    season: Season,
    is4k: boolean
  ): Promise<boolean> {
    let seasonExists = false;

    // Check each sonarr instance to see if the media still exists
    // If found, we will assume the media exists and prevent removal
    // We can use the cache we built when we fetched the series with mediaExistsInSonarr
    for (const server of this.sonarrServers) {
      let sonarrSeasons: SonarrSeason[] | undefined;

      if (media.externalServiceId && !is4k) {
        sonarrSeasons =
          this.sonarrSeasonsCache[`${server.id}-${media.externalServiceId}`];
      }

      if (media.externalServiceId4k && is4k) {
        sonarrSeasons =
          this.sonarrSeasonsCache[`${server.id}-${media.externalServiceId4k}`];
      }

      const seasonIsAvailable = sonarrSeasons?.find(
        ({ seasonNumber, statistics }) =>
          season.seasonNumber === seasonNumber &&
          statistics?.episodeFileCount &&
          statistics?.episodeFileCount > 0
      );

      if (seasonIsAvailable && sonarrSeasons) {
        seasonExists = true;
      }
    }

    return seasonExists;
  }

  private async mediaExistsInPlex(
    media: Media,
    is4k: boolean
  ): Promise<[boolean, Record<number, boolean>?]> {
    const ratingKey = media.ratingKey;
    const ratingKey4k = media.ratingKey4k;
    let existsInPlex = false;
    let preventSeasonSearch = false;

    // Check each plex instance to see if the media still exists
    // If found, we will assume the media exists and prevent removal
    // We can use the cache we built when we fetched the series with mediaExistsInPlex
    try {
      let plexMedia: PlexMetadata | undefined;

      if (ratingKey && !is4k) {
        plexMedia = await this.plexClient?.getMetadata(ratingKey);

        if (media.mediaType === 'tv') {
          this.plexSeasonsCache[ratingKey] =
            await this.plexClient?.getChildrenMetadata(ratingKey);
        }
      }

      if (ratingKey4k && is4k) {
        plexMedia = await this.plexClient?.getMetadata(ratingKey4k);

        if (media.mediaType === 'tv') {
          this.plexSeasonsCache[ratingKey4k] =
            await this.plexClient?.getChildrenMetadata(ratingKey4k);
        }
      }

      if (plexMedia) {
        existsInPlex = true;
      }
    } catch (ex) {
      if (!ex.message.includes('404')) {
        existsInPlex = true;
        preventSeasonSearch = true;
        logger.debug(
          `Failure retrieving the ${
            media.mediaType === 'tv' ? 'show' : 'movie'
          } with TMDB ID ${media.tmdbId} from your ${
            is4k ? '4K' : 'non-4K'
          } Plex.`,
          {
            errorMessage: ex.message,
            label: 'AvailabilitySync',
          }
        );
      }
    }

    // Here we check each season in plex for availability
    // If the API returns an error other than a 404,
    // we will have to prevent the season check from happening
    if (media.mediaType === 'tv') {
      const plexSeasonMap: Record<number, boolean> = {};

      if (!preventSeasonSearch) {
        media.seasons
          .filter(
            (season) =>
              season[is4k ? 'status4k' : 'status'] === MediaStatus.AVAILABLE ||
              season[is4k ? 'status4k' : 'status'] ===
                MediaStatus.PARTIALLY_AVAILABLE
          )
          .forEach(async (season) => {
            const seasonExists = await this.seasonExistsInPlex(
              media,
              season,
              is4k
            );

            if (seasonExists) {
              plexSeasonMap[season.seasonNumber] = true;
            }
          });
      }

      return [existsInPlex, plexSeasonMap];
    }

    return [existsInPlex];
  }

  private async seasonExistsInPlex(
    media: Media,
    season: Season,
    is4k: boolean
  ): Promise<boolean> {
    const ratingKey = media.ratingKey;
    const ratingKey4k = media.ratingKey4k;
    let seasonExistsInPlex = false;

    // Check each plex instance to see if the season exists
    let children: PlexMetadata[] | undefined;

    if (ratingKey && !is4k) {
      children = this.plexSeasonsCache[ratingKey];
    }

    if (ratingKey4k && is4k) {
      children = this.plexSeasonsCache[ratingKey4k];
    }

    const plexSeason = children?.find(
      (child) => child.index === season.seasonNumber
    );

    if (plexSeason) {
      seasonExistsInPlex = true;
    }

    return seasonExistsInPlex;
  }
}

const availabilitySync = new AvailabilitySync();
export default availabilitySync;
