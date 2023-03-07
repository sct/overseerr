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
import { User } from '@server/entity/User';
import type { RadarrSettings, SonarrSettings } from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';

class AvailabilitySync {
  public running = false;
  private plexClient: PlexAPI;
  private plexSeasonsCache: Record<string, PlexMetadata[]>;
  private sonarrSeasonsCache: Record<string, SonarrSeason[]>;
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

          const { existsInPlex } = await this.mediaExistsInPlex(media, false);
          const { existsInPlex: existsInPlex4k } = await this.mediaExistsInPlex(
            media,
            true
          );

          const existsInRadarr = await this.mediaExistsInRadarr(media, false);
          const existsInRadarr4k = await this.mediaExistsInRadarr(media, true);

          if (existsInPlex || existsInRadarr) {
            movieExists = true;
            logger.info(
              `The non-4K movie [TMDB ID ${media.tmdbId}] still exists. Preventing removal.`,
              {
                label: 'AvailabilitySync',
              }
            );
          }

          if (existsInPlex4k || existsInRadarr4k) {
            movieExists4k = true;
            logger.info(
              `The 4K movie [TMDB ID ${media.tmdbId}] still exists. Preventing removal.`,
              {
                label: 'AvailabilitySync',
              }
            );
          }

          if (!movieExists && media.status === MediaStatus.AVAILABLE) {
            await this.mediaUpdater(media, false);
          }

          if (!movieExists4k && media.status4k === MediaStatus.AVAILABLE) {
            await this.mediaUpdater(media, true);
          }
        }

        // If both versions still exist in plex, we still need
        // to check through sonarr to verify season availability
        if (media.mediaType === 'tv') {
          let showExists = false;
          let showExists4k = false;

          const { existsInPlex, seasonsMap: plexSeasonsMap = new Map() } =
            await this.mediaExistsInPlex(media, false);
          const {
            existsInPlex: existsInPlex4k,
            seasonsMap: plexSeasonsMap4k = new Map(),
          } = await this.mediaExistsInPlex(media, true);

          const { existsInSonarr, seasonsMap: sonarrSeasonsMap } =
            await this.mediaExistsInSonarr(media, false);
          const {
            existsInSonarr: existsInSonarr4k,
            seasonsMap: sonarrSeasonsMap4k,
          } = await this.mediaExistsInSonarr(media, true);

          if (existsInPlex || existsInSonarr) {
            showExists = true;
            logger.info(
              `The non-4K show [TMDB ID ${media.tmdbId}] still exists. Preventing removal.`,
              {
                label: 'AvailabilitySync',
              }
            );
          }

          if (existsInPlex4k || existsInSonarr4k) {
            showExists4k = true;
            logger.info(
              `The 4K show [TMDB ID ${media.tmdbId}] still exists. Preventing removal.`,
              {
                label: 'AvailabilitySync',
              }
            );
          }

          // Here we will create a final map that will cross compare
          // with plex and sonarr. Filtered seasons will go through
          // each season and assume the season does not exist. If Plex or
          // Sonarr finds that season, we will change the final seasons value
          // to true.
          const filteredSeasonsMap: Map<number, boolean> = new Map();

          media.seasons
            .filter(
              (season) =>
                season.status === MediaStatus.AVAILABLE ||
                season.status === MediaStatus.PARTIALLY_AVAILABLE
            )
            .forEach((season) =>
              filteredSeasonsMap.set(season.seasonNumber, false)
            );

          const finalSeasons = new Map([
            ...filteredSeasonsMap,
            ...plexSeasonsMap,
            ...sonarrSeasonsMap,
          ]);

          const filteredSeasonsMap4k: Map<number, boolean> = new Map();

          media.seasons
            .filter(
              (season) =>
                season.status4k === MediaStatus.AVAILABLE ||
                season.status4k === MediaStatus.PARTIALLY_AVAILABLE
            )
            .forEach((season) =>
              filteredSeasonsMap4k.set(season.seasonNumber, false)
            );

          const finalSeasons4k = new Map([
            ...filteredSeasonsMap4k,
            ...plexSeasonsMap4k,
            ...sonarrSeasonsMap4k,
          ]);

          if ([...finalSeasons.values()].includes(false)) {
            await this.seasonUpdater(media, finalSeasons, false);
          }

          if ([...finalSeasons4k.values()].includes(false)) {
            await this.seasonUpdater(media, finalSeasons4k, true);
          }

          if (
            !showExists &&
            (media.status === MediaStatus.AVAILABLE ||
              media.status === MediaStatus.PARTIALLY_AVAILABLE)
          ) {
            await this.mediaUpdater(media, false);
          }

          if (
            !showExists4k &&
            (media.status4k === MediaStatus.AVAILABLE ||
              media.status4k === MediaStatus.PARTIALLY_AVAILABLE)
          ) {
            await this.mediaUpdater(media, true);
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

  private async mediaUpdater(media: Media, is4k: boolean): Promise<void> {
    const mediaRepository = getRepository(Media);

    try {
      // If media type is tv, check if a season is processing
      //to see if we need to keep the external metadata
      let isMediaProcessing = false;

      if (media.mediaType === 'tv') {
        const requestRepository = getRepository(MediaRequest);

        const request = await requestRepository
          .createQueryBuilder('request')
          .leftJoinAndSelect('request.media', 'media')
          .where('(media.id = :id)', {
            id: media.id,
          })
          .andWhere(
            '(request.is4k = :is4k AND request.status = :requestStatus)',
            {
              requestStatus: MediaRequestStatus.APPROVED,
              is4k: is4k,
            }
          )
          .getOne();

        if (request) {
          isMediaProcessing = true;
        }
      }

      // Set the non-4K or 4K media to deleted
      // and change related columns to null if media
      // is not processing
      media[is4k ? 'status4k' : 'status'] = MediaStatus.DELETED;
      media[is4k ? 'serviceId4k' : 'serviceId'] = isMediaProcessing
        ? media[is4k ? 'serviceId4k' : 'serviceId']
        : null;
      media[is4k ? 'externalServiceId4k' : 'externalServiceId'] =
        isMediaProcessing
          ? media[is4k ? 'externalServiceId4k' : 'externalServiceId']
          : null;
      media[is4k ? 'externalServiceSlug4k' : 'externalServiceSlug'] =
        isMediaProcessing
          ? media[is4k ? 'externalServiceSlug4k' : 'externalServiceSlug']
          : null;
      media[is4k ? 'ratingKey4k' : 'ratingKey'] = isMediaProcessing
        ? media[is4k ? 'ratingKey4k' : 'ratingKey']
        : null;

      logger.info(
        `The ${is4k ? '4K' : 'non-4K'} ${
          media.mediaType === 'movie' ? 'movie' : 'show'
        } [TMDB ID ${media.tmdbId}] was not found in any ${
          media.mediaType === 'movie' ? 'Radarr' : 'Sonarr'
        } and Plex instance. Status will be changed to deleted.`,
        { label: 'AvailabilitySync' }
      );

      await mediaRepository.save({ media, ...media });
    } catch (ex) {
      logger.debug(
        `Failure updating the ${is4k ? '4K' : 'non-4K'} ${
          media.mediaType === 'tv' ? 'show' : 'movie'
        } [TMDB ID ${media.tmdbId}].`,
        {
          errorMessage: ex.message,
          label: 'AvailabilitySync',
        }
      );
    }
  }

  private async seasonUpdater(
    media: Media,
    seasons: Map<number, boolean>,
    is4k: boolean
  ): Promise<void> {
    const mediaRepository = getRepository(Media);

    // Filter out only the values that are false
    // (media that should be deleted)
    const seasonsPendingRemoval = new Map(
      // Disabled linter as only the value is needed from the filter
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      [...seasons].filter(([_, exists]) => !exists)
    );
    // Retrieve the season keys to pass into our log
    const seasonKeys = [...seasonsPendingRemoval.keys()];

    try {
      for (const mediaSeason of media.seasons) {
        if (seasonsPendingRemoval.has(mediaSeason.seasonNumber)) {
          mediaSeason[is4k ? 'status4k' : 'status'] = MediaStatus.DELETED;
        }
      }

      if (media.status === MediaStatus.AVAILABLE) {
        media.status = MediaStatus.PARTIALLY_AVAILABLE;
        logger.info(
          `Marking the non-4K show [TMDB ID ${media.tmdbId}] as PARTIALLY_AVAILABLE because season removal has occurred.`,
          { label: 'AvailabilitySync' }
        );
      }

      if (media.status4k === MediaStatus.AVAILABLE) {
        media.status4k = MediaStatus.PARTIALLY_AVAILABLE;
        logger.info(
          `Marking the 4K show [TMDB ID ${media.tmdbId}] as PARTIALLY_AVAILABLE because season removal has occurred.`,
          { label: 'AvailabilitySync' }
        );
      }

      await mediaRepository.save({ media, ...media });

      logger.info(
        `The ${is4k ? '4K' : 'non-4K'} season(s) [${seasonKeys}] [TMDB ID ${
          media.tmdbId
        }] was not found in any ${
          media.mediaType === 'tv' ? 'Sonarr' : 'Radarr'
        } and Plex instance. Status will be changed to deleted.`,
        { label: 'AvailabilitySync' }
      );
    } catch (ex) {
      logger.debug(
        `Failure updating the ${
          is4k ? '4K' : 'non-4K'
        } season(s) [${seasonKeys}], TMDB ID ${media.tmdbId}.`,
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
      if (server.is4k === is4k) {
        const radarrAPI = new RadarrAPI({
          apiKey: server.apiKey,
          url: RadarrAPI.buildUrl(server, '/api/v3'),
        });

        try {
          let radarr: RadarrMovie | undefined;

          if (media.externalServiceId && !is4k) {
            radarr = await radarrAPI.getMovie({
              id: media.externalServiceId,
            });
          }

          if (media.externalServiceId4k && is4k) {
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
              `Failure retrieving the ${
                is4k ? '4K' : 'non-4K'
              } movie [TMDB ID ${media.tmdbId}] from Radarr.`,
              {
                errorMessage: ex.message,
                label: 'AvailabilitySync',
              }
            );
          }
        }
      }
    }

    return existsInRadarr;
  }

  private async mediaExistsInSonarr(
    media: Media,
    is4k: boolean
  ): Promise<{ existsInSonarr: boolean; seasonsMap: Map<number, boolean> }> {
    let existsInSonarr = false;
    let preventSeasonSearch = false;

    // Check for availability in all of the available sonarr servers
    // If any find the media, we will assume the media exists
    for (const server of this.sonarrServers) {
      if (server.is4k === is4k) {
        const sonarrAPI = new SonarrAPI({
          apiKey: server.apiKey,
          url: SonarrAPI.buildUrl(server, '/api/v3'),
        });

        try {
          let sonarr: SonarrSeries | undefined;

          if (media.externalServiceId && !is4k) {
            sonarr = await sonarrAPI.getSeriesById(media.externalServiceId);
            this.sonarrSeasonsCache[`${server.id}-${media.externalServiceId}`] =
              sonarr.seasons;
          }

          if (media.externalServiceId4k && is4k) {
            sonarr = await sonarrAPI.getSeriesById(media.externalServiceId4k);
            this.sonarrSeasonsCache[
              `${server.id}-${media.externalServiceId4k}`
            ] = sonarr.seasons;
          }

          if (sonarr && sonarr.statistics.episodeFileCount > 0) {
            existsInSonarr = true;
          }
        } catch (ex) {
          if (!ex.message.includes('404')) {
            existsInSonarr = true;
            preventSeasonSearch = true;
            logger.debug(
              `Failure retrieving the ${is4k ? '4K' : 'non-4K'} show [TMDB ID ${
                media.tmdbId
              }] from Sonarr.`,
              {
                errorMessage: ex.message,
                label: 'AvailabilitySync',
              }
            );
          }
        }
      }
    }

    // Here we check each season for availability
    // If the API returns an error other than a 404,
    // we will have to prevent the season check from happening
    const seasonsMap: Map<number, boolean> = new Map();

    if (!preventSeasonSearch) {
      const filteredSeasons = media.seasons.filter(
        (season) =>
          season[is4k ? 'status4k' : 'status'] === MediaStatus.AVAILABLE ||
          season[is4k ? 'status4k' : 'status'] ===
            MediaStatus.PARTIALLY_AVAILABLE
      );

      for (const season of filteredSeasons) {
        const seasonExists = await this.seasonExistsInSonarr(
          media,
          season,
          is4k
        );

        if (seasonExists) {
          seasonsMap.set(season.seasonNumber, true);
        }
      }
    }

    return { existsInSonarr, seasonsMap };
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
  ): Promise<{ existsInPlex: boolean; seasonsMap?: Map<number, boolean> }> {
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
          `Failure retrieving the ${is4k ? '4K' : 'non-4K'} ${
            media.mediaType === 'tv' ? 'show' : 'movie'
          } [TMDB ID ${media.tmdbId}] from Plex.`,
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
      const seasonsMap: Map<number, boolean> = new Map();

      if (!preventSeasonSearch) {
        const filteredSeasons = media.seasons.filter(
          (season) =>
            season[is4k ? 'status4k' : 'status'] === MediaStatus.AVAILABLE ||
            season[is4k ? 'status4k' : 'status'] ===
              MediaStatus.PARTIALLY_AVAILABLE
        );

        for (const season of filteredSeasons) {
          const seasonExists = await this.seasonExistsInPlex(
            media,
            season,
            is4k
          );

          if (seasonExists) {
            seasonsMap.set(season.seasonNumber, true);
          }
        }
      }

      return { existsInPlex, seasonsMap };
    }

    return { existsInPlex };
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
    let plexSeasons: PlexMetadata[] | undefined;

    if (ratingKey && !is4k) {
      plexSeasons = this.plexSeasonsCache[ratingKey];
    }

    if (ratingKey4k && is4k) {
      plexSeasons = this.plexSeasonsCache[ratingKey4k];
    }

    const seasonIsAvailable = plexSeasons?.find(
      (plexSeason) => plexSeason.index === season.seasonNumber
    );

    if (seasonIsAvailable) {
      seasonExistsInPlex = true;
    }

    return seasonExistsInPlex;
  }
}

const availabilitySync = new AvailabilitySync();

export default availabilitySync;
