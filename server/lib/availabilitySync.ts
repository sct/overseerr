import type { PlexLibraryItem, PlexMetadata } from '@server/api/plexapi';
import PlexAPI from '@server/api/plexapi';
import type { RadarrMovie } from '@server/api/servarr/radarr';
import RadarrAPI from '@server/api/servarr/radarr';
import type { SonarrSeason, SonarrSeries } from '@server/api/servarr/sonarr';
import SonarrAPI from '@server/api/servarr/sonarr';
import { MediaRequestStatus, MediaStatus } from '@server/constants/media';
import { getRepository } from '@server/datasource';
import Media from '@server/entity/Media';
import MediaRequest from '@server/entity/MediaRequest';
import Season from '@server/entity/Season';
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
    this.plexSeasonsCache = {};
    this.sonarrSeasonsCache = {};
    this.radarrServers = settings.radarr.filter((server) => server.syncEnabled);
    this.sonarrServers = settings.sonarr.filter((server) => server.syncEnabled);

    try {
      await this.initPlexClient();

      if (!this.plexClient) {
        return;
      }

      logger.info(`Starting availability sync...`, {
        label: 'AvailabilitySync',
      });
      const mediaRepository = getRepository(Media);
      const requestRepository = getRepository(MediaRequest);
      const pageSize = 50;

      for await (const media of this.loadAvailableMediaPaginated(pageSize)) {
        if (!this.running) {
          throw new Error('Job aborted');
        }

        const mediaExists = await this.mediaExists(media);

        // We can not delete media so if both versions do not exist, we will change both columns to unknown or null
        if (!mediaExists) {
          logger.info(
            `Media with TMDB ID ${media.tmdbId} does not exist in any of your media instances. Status will be changed to unknown.`,
            { label: 'AvailabilitySync' }
          );

          // Find all related requests only if
          // related media is available
          const requests = await requestRepository
            .createQueryBuilder('request')
            .leftJoinAndSelect('request.media', 'media')
            .where('(media.id = :id)', {
              id: media.id,
            })
            .andWhere(
              '((request.is4k = 0 AND media.status IN (:...mediaStatus)) OR (request.is4k = 1 AND media.status4k IN (:...mediaStatus)))',
              {
                mediaStatus: [
                  MediaStatus.AVAILABLE,
                  MediaStatus.PARTIALLY_AVAILABLE,
                ],
              }
            )
            .getMany();

          // Check if a season is processing or pending to
          // make sure we set media to the correct status
          let mediaStatus = MediaStatus.UNKNOWN;
          let mediaStatus4k = MediaStatus.UNKNOWN;

          if (media.mediaType === 'tv') {
            mediaStatus = await this.findMediaStatus(requests, false);
            mediaStatus4k = await this.findMediaStatus(requests, true);
          }

          if (
            media.status === MediaStatus.AVAILABLE ||
            media.status === MediaStatus.PARTIALLY_AVAILABLE
          ) {
            (media.status = mediaStatus),
              (media.serviceId =
                mediaStatus === MediaStatus.PROCESSING
                  ? media.serviceId
                  : null),
              (media.externalServiceId =
                mediaStatus === MediaStatus.PROCESSING
                  ? media.externalServiceId
                  : null),
              (media.externalServiceSlug =
                mediaStatus === MediaStatus.PROCESSING
                  ? media.externalServiceSlug
                  : null),
              (media.ratingKey =
                mediaStatus === MediaStatus.PROCESSING
                  ? media.ratingKey
                  : null);
          }

          if (
            media.status4k === MediaStatus.AVAILABLE ||
            media.status4k === MediaStatus.PARTIALLY_AVAILABLE
          ) {
            (media.status4k = mediaStatus4k),
              (media.serviceId4k =
                mediaStatus === MediaStatus.PROCESSING
                  ? media.serviceId4k
                  : null),
              (media.externalServiceId4k =
                mediaStatus === MediaStatus.PROCESSING
                  ? media.externalServiceId4k
                  : null),
              (media.externalServiceSlug4k =
                mediaStatus === MediaStatus.PROCESSING
                  ? media.externalServiceSlug4k
                  : null),
              (media.ratingKey4k =
                mediaStatus === MediaStatus.PROCESSING
                  ? media.ratingKey4k
                  : null);
          }

          await mediaRepository.save({ media, ...media });

          // Only delete media request if type is movie.
          // Type tv request deletion is handled
          // in the season request entity
          if (requests.length > 0 && media.mediaType === 'movie') {
            await requestRepository.remove(requests);
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

  private async findMediaStatus(
    requests: MediaRequest[],
    is4k?: boolean
  ): Promise<MediaStatus> {
    let filteredRequests: MediaRequest[] = requests;

    if (is4k !== undefined) {
      filteredRequests = requests.filter((request) => request.is4k === is4k);
    }

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
      logger.info(
        `Media with TMDB ID ${media.tmdbId} does not exist in your ${
          is4k ? '4k' : 'non-4k'
        } ${
          media.mediaType === 'tv' ? 'Sonarr' : 'Radarr'
        } and Plex instance. Status will be changed to unknown.`,
        { label: 'AvailabilitySync' }
      );

      const requests = await requestRepository.find({
        relations: {
          media: true,
        },
        where: { media: { id: media.id }, is4k: is4k },
      });

      // Check if a season is processing or pending to
      // make sure we set media to the correct status
      let mediaStatus = MediaStatus.UNKNOWN;

      if (media.mediaType === 'tv') {
        mediaStatus = await this.findMediaStatus(requests);
      }

      await mediaRepository.update(
        media.id,
        is4k
          ? {
              status4k: mediaStatus,
              serviceId4k:
                mediaStatus === MediaStatus.PROCESSING
                  ? media.serviceId4k
                  : null,
              externalServiceId4k:
                mediaStatus === MediaStatus.PROCESSING
                  ? media.externalServiceId4k
                  : null,
              externalServiceSlug4k:
                mediaStatus === MediaStatus.PROCESSING
                  ? media.externalServiceSlug4k
                  : null,
              ratingKey4k:
                mediaStatus === MediaStatus.PROCESSING
                  ? media.ratingKey4k
                  : null,
            }
          : {
              status: mediaStatus,
              serviceId:
                mediaStatus === MediaStatus.PROCESSING ? media.serviceId : null,
              externalServiceId:
                mediaStatus === MediaStatus.PROCESSING
                  ? media.externalServiceId
                  : null,
              externalServiceSlug:
                mediaStatus === MediaStatus.PROCESSING
                  ? media.externalServiceSlug
                  : null,
              ratingKey:
                mediaStatus === MediaStatus.PROCESSING ? media.ratingKey : null,
            }
      );

      // Only delete media request if type is movie.
      // Type tv request deletion is handled
      // in the season request entity
      if (media.mediaType === 'movie') {
        if (requests.length > 0) {
          await requestRepository.remove(requests);
        }
      }
    } catch (ex) {
      logger.debug(`Failure updating media with TMDB ID ${media.tmdbId}.`, {
        errorMessage: ex.message,
        label: 'AvailabilitySync',
      });
    }
  }

  private async mediaExistsInRadarr(
    media: Media,
    existsInPlex: boolean,
    existsInPlex4k: boolean
  ): Promise<boolean> {
    let movieExists = true;
    let movieExists4k = true;
    let radarr: RadarrMovie | undefined;
    let radarr4k: RadarrMovie | undefined;

    for (const server of this.radarrServers) {
      const api = new RadarrAPI({
        apiKey: server.apiKey,
        url: RadarrAPI.buildUrl(server, '/api/v3'),
      });
      try {
        // Check if both exist or if a single non-4k or 4k exists
        // If both do not exist we will return false
        if (!server.is4k && media.externalServiceId) {
          radarr = await api.getMovie({ id: media.externalServiceId });
        }

        if (server.is4k && media.externalServiceId4k) {
          radarr4k = await api.getMovie({ id: media.externalServiceId4k });
        }
      } catch (ex) {
        logger.debug(
          `Failure retrieving media with TMDB ID ${media.tmdbId} from your ${
            !server.is4k ? 'non-4K' : '4K'
          } Radarr.`,
          {
            errorMessage: ex.message,
            label: 'AvailabilitySync',
          }
        );
      }
    }

    if ((!radarr || !radarr.hasFile) && !existsInPlex) {
      movieExists = false;
    }

    if ((!radarr4k || !radarr4k.hasFile) && !existsInPlex4k) {
      movieExists4k = false;
    }

    // If only a single non-4k or 4k exists, then change entity columns accordingly
    // Related media request will then be deleted
    if (!movieExists && movieExists4k) {
      if (media.status === MediaStatus.AVAILABLE) {
        await this.mediaUpdater(media, false);
      }
    }

    if (movieExists && !movieExists4k) {
      if (media.status4k === MediaStatus.AVAILABLE) {
        await this.mediaUpdater(media, true);
      }
    }

    if (movieExists || movieExists4k) {
      return true;
    }

    return false;
  }

  private async mediaExistsInSonarr(
    media: Media,
    existsInPlex: boolean,
    existsInPlex4k: boolean
  ): Promise<boolean> {
    let showExists = true;
    let showExists4k = true;
    let sonarr: SonarrSeries | undefined;
    let sonarr4k: SonarrSeries | undefined;

    for (const server of this.sonarrServers) {
      const api = new SonarrAPI({
        apiKey: server.apiKey,
        url: SonarrAPI.buildUrl(server, '/api/v3'),
      });
      try {
        // Check if both exist or if a single non-4k or 4k exists
        // If both do not exist we will return false
        if (!server.is4k && media.externalServiceId) {
          sonarr = await api.getSeriesById(media.externalServiceId);
          this.sonarrSeasonsCache[`${server.id}-${media.externalServiceId}`] =
            sonarr.seasons;
        }

        if (server.is4k && media.externalServiceId4k) {
          sonarr4k = await api.getSeriesById(media.externalServiceId4k);
          this.sonarrSeasonsCache[`${server.id}-${media.externalServiceId4k}`] =
            sonarr4k.seasons;
        }
      } catch (ex) {
        logger.debug(
          `Failure retrieving media with TMDB ID ${media.tmdbId} from your ${
            !server.is4k ? 'non-4K' : '4K'
          } Sonarr.`,
          {
            errorMessage: ex.message,
            label: 'AvailabilitySync',
          }
        );
      }
    }

    if (
      (!sonarr || sonarr.statistics.episodeFileCount === 0) &&
      !existsInPlex
    ) {
      showExists = false;
    }

    if (
      (!sonarr4k || sonarr4k.statistics.episodeFileCount === 0) &&
      !existsInPlex4k
    ) {
      showExists4k = false;
    }

    // Here we check each season for availability
    for (const season of media.seasons) {
      await this.seasonExists(media, season, showExists, showExists4k);
    }

    // If only a single non-4k or 4k exists, then change entity columns accordingly
    // Related media request will then be deleted
    if (!showExists && showExists4k) {
      if (
        media.status === MediaStatus.AVAILABLE ||
        media.status === MediaStatus.PARTIALLY_AVAILABLE
      ) {
        await this.mediaUpdater(media, false);
      }
    }

    if (showExists && !showExists4k) {
      if (
        media.status4k === MediaStatus.AVAILABLE ||
        media.status4k === MediaStatus.PARTIALLY_AVAILABLE
      ) {
        await this.mediaUpdater(media, true);
      }
    }

    if (showExists || showExists4k) {
      return true;
    }

    return false;
  }

  private async seasonExistsInSonarr(
    media: Media,
    season: Season,
    seasonExistsInPlex: boolean,
    seasonExistsInPlex4k: boolean,
    showExists: boolean,
    showExists4k: boolean
  ): Promise<void> {
    let seasonExists = true;
    let seasonExists4k = true;
    let sonarrSeasons: SonarrSeason[] | undefined;
    let sonarrSeasons4k: SonarrSeason[] | undefined;

    const mediaRepository = getRepository(Media);
    const seasonRepository = getRepository(Season);
    const seasonRequestRepository = getRepository(SeasonRequest);

    for (const server of this.sonarrServers) {
      const api = new SonarrAPI({
        apiKey: server.apiKey,
        url: SonarrAPI.buildUrl(server, '/api/v3'),
      });

      try {
        // Here we can use the cache we built when we fetched the series with mediaExistsInSonarr
        // If the cache does not have data, we will fetch with the api route
        if (!server.is4k && media.externalServiceId && showExists) {
          sonarrSeasons =
            this.sonarrSeasonsCache[
              `${server.id}-${media.externalServiceId}`
            ] ?? (await api.getSeriesById(media.externalServiceId)).seasons;
          this.sonarrSeasonsCache[`${server.id}-${media.externalServiceId}`] =
            sonarrSeasons;
        }

        if (server.is4k && media.externalServiceId4k && showExists4k) {
          sonarrSeasons4k =
            this.sonarrSeasonsCache[
              `${server.id}-${media.externalServiceId4k}`
            ] ?? (await api.getSeriesById(media.externalServiceId4k)).seasons;
          this.sonarrSeasonsCache[`${server.id}-${media.externalServiceId4k}`] =
            sonarrSeasons4k;
        }
      } catch (ex) {
        logger.debug(
          `Failure retrieving media with TMDB ID ${media.tmdbId} from your ${
            !server.is4k ? 'non-4K' : '4K'
          } Sonarr.`,
          {
            errorMessage: ex.message,
            label: 'AvailabilitySync',
          }
        );
      }
    }

    const seasonIsUnavailable = sonarrSeasons?.find(
      ({ seasonNumber, statistics }) =>
        season.seasonNumber === seasonNumber &&
        statistics?.episodeFileCount === 0
    );

    const seasonIsUnavailable4k = sonarrSeasons4k?.find(
      ({ seasonNumber, statistics }) =>
        season.seasonNumber === seasonNumber &&
        statistics?.episodeFileCount === 0
    );

    if ((seasonIsUnavailable || !sonarrSeasons) && !seasonExistsInPlex) {
      seasonExists = false;
    }

    if ((seasonIsUnavailable4k || !sonarrSeasons4k) && !seasonExistsInPlex4k) {
      seasonExists4k = false;
    }

    try {
      const seasonRequests = await seasonRequestRepository.find({
        relations: {
          request: {
            media: {
              seasons: true,
            },
          },
        },
        where: {
          request: {
            media: {
              id: media.id,
            },
          },
          seasonNumber: season.seasonNumber,
        },
      });

      const filteredSeasonRequests = seasonRequests.filter(
        (seasonRequest) =>
          (!seasonRequest.request.is4k &&
            !seasonExists &&
            (season.status === MediaStatus.AVAILABLE ||
              season.status === MediaStatus.PARTIALLY_AVAILABLE)) ||
          (seasonRequest.request.is4k &&
            !seasonExists4k &&
            (season.status4k === MediaStatus.AVAILABLE ||
              season.status4k === MediaStatus.PARTIALLY_AVAILABLE))
      );

      let deletedSeason = false;

      // If season does not exist, we will change status to unknown and delete related season request
      // If parent media request is empty(all related seasons have been removed), parent is automatically deleted
      if (!seasonExists && seasonExists4k) {
        if (
          season.status === MediaStatus.AVAILABLE ||
          season.status === MediaStatus.PARTIALLY_AVAILABLE
        ) {
          logger.info(
            `Season ${season.seasonNumber}, TMDB ID ${media.tmdbId}, does not exist in your non-4k Sonarr and Plex instance. Status will be changed to unknown.`,
            { label: 'AvailabilitySync' }
          );

          season.status = MediaStatus.UNKNOWN;
          deletedSeason = true;
        }
      }

      if (seasonExists && !seasonExists4k) {
        if (
          season.status4k === MediaStatus.AVAILABLE ||
          season.status4k === MediaStatus.PARTIALLY_AVAILABLE
        ) {
          logger.info(
            `Season ${season.seasonNumber}, TMDB ID ${media.tmdbId}, does not exist in your 4k Sonarr and Plex instance. Status will be changed to unknown.`,
            { label: 'AvailabilitySync' }
          );

          season.status4k = MediaStatus.UNKNOWN;
          deletedSeason = true;
        }
      }

      if (!seasonExists && !seasonExists4k) {
        if (
          season.status === MediaStatus.AVAILABLE ||
          season.status === MediaStatus.PARTIALLY_AVAILABLE
        ) {
          season.status = MediaStatus.UNKNOWN;
          deletedSeason = true;
        }
        if (
          season.status4k === MediaStatus.AVAILABLE ||
          season.status4k === MediaStatus.PARTIALLY_AVAILABLE
        ) {
          season.status4k = MediaStatus.UNKNOWN;
          deletedSeason = true;
        }
      }

      if (deletedSeason) {
        await seasonRepository.save({ season, ...season });

        if (!seasonExists && !seasonExists4k) {
          logger.info(
            `Removing season ${season.seasonNumber}, TMDB ID ${media.id}, because it does not exist in any of your media instances.`,
            { label: 'AvailabilitySync' }
          );
        }

        if (media.status === MediaStatus.AVAILABLE) {
          logger.info(
            `Marking non-4k media with TMDB ID ${media.tmdbId} as PARTIALLY_AVAILABLE because season removal has occurred.`,
            { label: 'AvailabilitySync' }
          );
          await mediaRepository.update(media.id, {
            status: MediaStatus.PARTIALLY_AVAILABLE,
          });
        }

        if (media.status4k === MediaStatus.AVAILABLE) {
          logger.info(
            `Marking 4k media with TMDB ID ${media.tmdbId} as PARTIALLY_AVAILABLE because season removal has occurred.`,
            { label: 'AvailabilitySync' }
          );
          await mediaRepository.update(media.id, {
            status4k: MediaStatus.PARTIALLY_AVAILABLE,
          });
        }

        if (filteredSeasonRequests.length > 0) {
          await seasonRequestRepository.remove(filteredSeasonRequests);
        }
      }
    } catch (ex) {
      logger.debug(`Failure updating media with TMDB ID ${media.tmdbId}.`, {
        errorMessage: ex.message,
        label: 'AvailabilitySync',
      });
    }
  }

  private async mediaExists(media: Media): Promise<boolean> {
    const ratingKey = media.ratingKey;
    const ratingKey4k = media.ratingKey4k;

    let existsInPlex = true;
    let existsInPlex4k = true;
    let plex: PlexLibraryItem | undefined;
    let plex4k: PlexLibraryItem | undefined;

    // Check each plex instance to see if media exists
    if (ratingKey) {
      try {
        plex = await this.plexClient?.getMetadata(ratingKey);
      } catch (ex) {
        logger.debug(`Failed to retrieve Plex non-4k metadata.`, {
          errorMessage: ex.message,
          label: 'AvailabilitySync',
        });
      }
    }

    if (ratingKey4k) {
      try {
        plex4k = await this.plexClient?.getMetadata(ratingKey4k);
      } catch (ex) {
        logger.debug(`Failed to retrieve Plex 4k metadata.`, {
          errorMessage: ex.message,
          label: 'AvailabilitySync',
        });
      }
    }

    if (!plex) {
      existsInPlex = false;
    }

    if (!plex4k) {
      existsInPlex4k = false;
    }

    // We then check radarr or sonarr has that specific media. If not, then we will move to delete
    // If a non-4k or 4k version exists in at least one of the instances, we will only update that specific version
    if (media.mediaType === 'movie') {
      if (existsInPlex && existsInPlex4k) {
        return true;
      }

      const existsInRadarr = await this.mediaExistsInRadarr(
        media,
        existsInPlex,
        existsInPlex4k
      );

      // If true, media exists in at least one radarr or plex instance.
      if (existsInRadarr) {
        logger.warn(
          `Media with TMDB ID ${media.tmdbId} exists in at least one Radarr or Plex instance.`,
          {
            label: 'AvailabilitySync',
          }
        );

        return true;
      }
    }

    // If both versions still exist in plex, we still need
    // to check through sonarr to verify season availability
    if (media.mediaType === 'tv') {
      const existsInSonarr = await this.mediaExistsInSonarr(
        media,
        existsInPlex,
        existsInPlex4k
      );

      // If true, media exists in at least one sonarr or plex instance.
      if (existsInSonarr) {
        logger.warn(
          `Media with TMDB ID ${media.tmdbId} exists in at least one Sonarr or Plex instance.`,
          {
            label: 'AvailabilitySync',
          }
        );

        return true;
      }
    }

    return false;
  }

  private async seasonExists(
    media: Media,
    season: Season,
    showExists: boolean,
    showExists4k: boolean
  ): Promise<void> {
    const ratingKey = media.ratingKey;
    const ratingKey4k = media.ratingKey4k;

    let seasonExistsInPlex = true;
    let seasonExistsInPlex4k = true;
    let plexSeason: PlexMetadata | undefined;
    let plexSeason4k: PlexMetadata | undefined;

    // Check each plex instance to see if the season exists
    if (ratingKey && showExists) {
      try {
        const children =
          this.plexSeasonsCache[ratingKey] ??
          (await this.plexClient?.getChildrenMetadata(ratingKey)) ??
          [];
        this.plexSeasonsCache[ratingKey] = children;
        plexSeason = children?.find(
          (child) => child.index === season.seasonNumber
        );
      } catch (ex) {
        logger.debug(`Failed to retrieve Plex's non-4k season metadata.`, {
          errorMessage: ex.message,
          label: 'AvailabilitySync',
        });
      }
    }
    if (ratingKey4k && showExists4k) {
      try {
        const children4k =
          this.plexSeasonsCache[ratingKey4k] ??
          (await this.plexClient?.getChildrenMetadata(ratingKey4k)) ??
          [];
        this.plexSeasonsCache[ratingKey4k] = children4k;
        plexSeason4k = children4k?.find(
          (child) => child.index === season.seasonNumber
        );
      } catch (ex) {
        logger.debug(`Failed to retrieve Plex's 4k season metadata.`, {
          errorMessage: ex.message,
          label: 'AvailabilitySync',
        });
      }
    }

    if (!plexSeason) {
      seasonExistsInPlex = false;
    }

    if (!plexSeason4k) {
      seasonExistsInPlex4k = false;
    }

    // Base case if both season versions exist in plex
    if (seasonExistsInPlex && seasonExistsInPlex4k) {
      return;
    }

    await this.seasonExistsInSonarr(
      media,
      season,
      seasonExistsInPlex,
      seasonExistsInPlex4k,
      showExists,
      showExists4k
    );
  }

  private async initPlexClient() {
    const userRepository = getRepository(User);
    const admin = await userRepository.findOne({
      select: { id: true, plexToken: true },
      where: { id: 1 },
    });

    if (!admin) {
      logger.warning('No admin configured. Availability sync skipped.');
      return;
    }

    this.plexClient = new PlexAPI({ plexToken: admin.plexToken });
  }
}

const availabilitySync = new AvailabilitySync();
export default availabilitySync;
