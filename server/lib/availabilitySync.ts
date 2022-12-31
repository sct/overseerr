import type { PlexMetadata } from '@server/api/plexapi';
import PlexAPI from '@server/api/plexapi';
import RadarrAPI from '@server/api/servarr/radarr';
import type { SonarrSeason } from '@server/api/servarr/sonarr';
import SonarrAPI from '@server/api/servarr/sonarr';
import { MediaStatus } from '@server/constants/media';
import { getRepository } from '@server/datasource';
import Media from '@server/entity/Media';
import MediaRequest from '@server/entity/MediaRequest';
import Season from '@server/entity/Season';
import SeasonRequest from '@server/entity/SeasonRequest';
import { User } from '@server/entity/User';
import type { RadarrSettings, SonarrSettings } from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { In } from 'typeorm';

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
    await this.initPlexClient();

    // console.log({ sonarSeasons: this.sonarrSeasonsCache });

    if (!this.plexClient) {
      return;
    }

    logger.debug(`Starting availability sync...`, {
      label: 'AvailabilitySync',
    });

    try {
      const mediaRepository = getRepository(Media);
      const seasonRepository = getRepository(Season);

      /*
       * We cannot immediately delete media items, because it would invalidate our page iteration.
       * This could be fixed by using a transaction with a "READ COMMITTED" isolation level, but this is unavailable in SQLite
       */
      const mediaToDelete: number[] = [];

      const pageSize = 50;
      for await (const mediaPage of this.loadAvailableMediaPaginated(
        pageSize
      )) {
        if (!this.running) {
          throw new Error('Job aborted');
        }

        for (const media of mediaPage) {
          const mediaExists = await this.mediaExists(media);

          if (!mediaExists) {
            logger.debug(
              `Queueing media id: ${media.tmdbId} for removal because it doesn't appear in any of the libraries anymore`,
              { label: 'AvailabilitySync' }
            );
            mediaToDelete.push(media.id);
            continue;
          }

          if (media.mediaType === 'tv') {
            // ok, the show itself exists, but do all it's seasons?
            const seasons = await seasonRepository.find({
              where: [
                { status: MediaStatus.AVAILABLE, media: { id: media.id } },
                { status4k: MediaStatus.AVAILABLE, media: { id: media.id } },
              ],
            });

            // console.log('season REPOSITORY', { seasons });

            let didDeleteSeasons = false;
            for (const season of seasons) {
              const seasonExists = await this.seasonExists(media, season);

              if (!seasonExists) {
                logger.debug(
                  `Removing season ${season.seasonNumber} for media id: ${media.tmdbId} because it doesn't appear in any of the libraries anymore`,
                  { label: 'AvailabilitySync' }
                );
                await seasonRepository.delete(season.id);
                didDeleteSeasons = true;
              }
            }

            if (didDeleteSeasons) {
              if (
                media.status === MediaStatus.AVAILABLE ||
                media.status4k === MediaStatus.AVAILABLE
              ) {
                logger.debug(
                  `Marking media id: ${media.tmdbId} as PARTIALLY_AVAILABLE because we deleted some of it's seasons`,
                  { label: 'AvailabilitySync' }
                );
                if (media.status === MediaStatus.AVAILABLE) {
                  await mediaRepository.update(media.id, {
                    status: MediaStatus.PARTIALLY_AVAILABLE,
                  });
                }
                if (media.status4k === MediaStatus.AVAILABLE) {
                  await mediaRepository.update(media.id, {
                    status4k: MediaStatus.PARTIALLY_AVAILABLE,
                  });
                }
              }
            }
          }
        }
      }

      // After we have processed all media items we can execute our queued deletions
      await mediaRepository.delete({ id: In(mediaToDelete) });
    } catch (ex) {
      logger.error('Failed to complete availability sync', {
        errorMessage: ex.message,
        label: 'AvailabilitySync',
      });
    } finally {
      logger.debug(`Availability sync complete`, { label: 'AvailabilitySync' });
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

    let mediaPage = await mediaRepository.find({
      where: whereOptions,
      skip: offset,
      take: pageSize,
    });

    do {
      yield mediaPage;
      offset += pageSize;
      mediaPage = await mediaRepository.find({
        where: whereOptions,
        skip: offset,
        take: pageSize,
      });
    } while (mediaPage.length > 0);
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

  private async mediaExistsInPlex(media: Media): Promise<boolean> {
    const ratingKey = media.ratingKey;
    const ratingKey4k = media.ratingKey4k;

    const mediaStatus =
      media.status === MediaStatus.AVAILABLE ||
      media.status === MediaStatus.PARTIALLY_AVAILABLE;

    const mediaStatus4k =
      media.status4k === MediaStatus.AVAILABLE ||
      media.status4k === MediaStatus.PARTIALLY_AVAILABLE;

    if (media.tmdbId === 8010) {
      console.log({ media });
    }

    if (!ratingKey && !ratingKey4k) {
      return false;
    }

    let existsInPlex = false;
    let existsInPlex4k = false;

    try {
      // if (media.mediaType === 'movie') {
      //   return true;
      // }

      if (ratingKey && ratingKey4k) {
        const meta = await this.plexClient?.getMetadata(ratingKey);
        const meta4k = await this.plexClient?.getMetadata(ratingKey4k);
        // console.log({ meta });

        if (meta && meta4k) {
          existsInPlex = true;
          existsInPlex4k = true;
        }
      }
      if (ratingKey) {
        const meta = await this.plexClient?.getMetadata(ratingKey);
        // return !!meta;
        if (meta) {
          // console.log('IS THIS WORKING');
          existsInPlex = true;
        }
      }
      if (ratingKey4k) {
        const meta4k = await this.plexClient?.getMetadata(ratingKey4k);
        // return !!meta;
        if (meta4k) {
          existsInPlex4k = true;
        }
      }
    } catch (ex) {
      // TODO: oof, not the nicest way of handling this, but plex-api does not leave us with any other options...
      if (!ex.message.includes('response code: 404')) {
        throw ex;
      }
    }

    // if (
    //   media.status ===
    //     (MediaStatus.AVAILABLE || MediaStatus.PARTIALLY_AVAILABLE) &&
    //   media.status4k ===
    //     (MediaStatus.AVAILABLE || MediaStatus.PARTIALLY_AVAILABLE)
    // ) {
    //   if (existsInPlex && existsInPlex4k) {
    //     return true;
    //   }
    // }
    // if (
    //   media.status ===
    //   (MediaStatus.AVAILABLE || MediaStatus.PARTIALLY_AVAILABLE)
    // ) {
    //   if (!existsInPlex) {
    //     return false;
    //   }
    // }

    // if (
    //   media.status4k ===
    //   (MediaStatus.AVAILABLE || MediaStatus.PARTIALLY_AVAILABLE)
    // ) {
    //   if (!existsInPlex4k) {
    //     return false;
    //   }
    // }

    if (existsInPlex && existsInPlex4k) {
      return true;
    } else if (!existsInPlex && existsInPlex4k && mediaStatus) {
      return false;
    } else if (existsInPlex && !existsInPlex4k && mediaStatus4k) {
      return false;
    } else {
      return true;
    }

    // return false;
  }

  private async seasonExistsInPlex(media: Media, season: Season) {
    const ratingKey = media.ratingKey;
    const ratingKey4k = media.ratingKey4k;

    let seasonMeta;
    let seasonMeta4k;

    if (!ratingKey && !ratingKey4k) {
      return false;
    }

    if (ratingKey) {
      const children =
        this.plexSeasonsCache[ratingKey] ??
        (await this.plexClient?.getChildrenMetadata(ratingKey)) ??
        [];
      this.plexSeasonsCache[ratingKey] = children;
      // console.log({ seasonsCache: this.plexSeasonsCache[ratingKey] });
      seasonMeta = children?.find(
        (child) => child.index === season.seasonNumber
      );
    }

    if (ratingKey4k) {
      const children4k =
        this.plexSeasonsCache[ratingKey4k] ??
        (await this.plexClient?.getChildrenMetadata(ratingKey4k)) ??
        [];
      this.plexSeasonsCache[ratingKey4k] = children4k;
      // console.log({ seasonsCache4k: this.plexSeasonsCache[ratingKey4k] });
      seasonMeta4k = children4k?.find(
        (child) => child.index === season.seasonNumber
      );
    }

    if (ratingKey && ratingKey4k) {
      return !!seasonMeta && !!seasonMeta4k;
    } else if (ratingKey) {
      return !!seasonMeta;
    } else if (ratingKey4k) {
      return !!seasonMeta4k;
    } else {
      return false;
    }
  }

  private async mediaExistsInRadarr(media: Media): Promise<boolean> {
    const mediaRepository = getRepository(Media);
    const requestRepository = getRepository(MediaRequest);

    const request = await requestRepository.findOne({
      where: { media: { id: media.id }, is4k: false },
    });
    const request4k = await requestRepository.findOne({
      where: { media: { id: media.id }, is4k: true },
    });

    let existsInRadarr = true;
    let existsInRadarr4k = true;

    for (const server of this.radarrServers) {
      const api = new RadarrAPI({
        apiKey: server.apiKey,
        url: RadarrAPI.buildUrl(server, '/api/v3'),
      });
      const meta = await api.getMovieByTmdbId(media.tmdbId);

      // console.log({ radarrserver: server.id });
      // console.log({ radarrport: server.port });
      // console.log({ is4K: server.is4k });

      //check if both exist or if a single non-4k or 4k exists
      //if only a single non-4k or 4k exists, then change entity columns accordingly
      //if both do not exist we will return false

      // console.log({ status: media.status });
      if (!server.is4k && !meta.id) {
        existsInRadarr = false;
      }
      // console.log({ status4k: media.status4k });
      if (server.is4k && !meta.id) {
        existsInRadarr4k = false;
      }
    }
    if (existsInRadarr && existsInRadarr4k) {
      return true;
    }

    if (!existsInRadarr && existsInRadarr4k) {
      if (media.status !== MediaStatus.UNKNOWN) {
        logger.debug(
          `${media.tmdbId} does not exist in your non-4k radarr instance so we will change it's status to unknown`,
          { label: 'AvailabilitySync' }
        );
        await mediaRepository.update(media.id, {
          status: MediaStatus.UNKNOWN,
          serviceId: null,
          externalServiceId: null,
          externalServiceSlug: null,
          ratingKey: null,
        });
        await requestRepository.delete({ id: request?.id });
      }
      return true;
    }
    if (existsInRadarr && !existsInRadarr4k) {
      if (media.status4k !== MediaStatus.UNKNOWN) {
        logger.debug(
          `${media.tmdbId} does not exist in your 4k radarr instance so we will change it's status to unknown`,
          { label: 'AvailabilitySync' }
        );
        await mediaRepository.update(media.id, {
          status4k: MediaStatus.UNKNOWN,
          serviceId4k: null,
          externalServiceId4k: null,
          externalServiceSlug4k: null,
          ratingKey4k: null,
        });
        await requestRepository.delete({ id: request4k?.id });
      }
      return true;
    }

    return false;
  }

  private async mediaExistsInSonarr(media: Media): Promise<boolean> {
    if (!media.tvdbId) {
      return false;
    }

    const mediaRepository = getRepository(Media);
    // const requestRepository = getRepository(MediaRequest);

    // const request = await requestRepository.findOne({
    //   where: { media: { id: media.id }, is4k: false },
    // });
    // const request4k = await requestRepository.findOne({
    //   where: { media: { id: media.id }, is4k: true },
    // });

    let existsInSonarr = true;
    let existsInSonarr4k = true;

    for (const server of this.sonarrServers) {
      const api = new SonarrAPI({
        apiKey: server.apiKey,
        url: SonarrAPI.buildUrl(server, '/api/v3'),
      });

      const meta = await api.getSeriesByTvdbId(media.tvdbId);

      // console.log({ sonarrserver: server.id });
      // console.log({ sonarrport: server.port });
      // console.log({ is4K: server.is4k });

      this.sonarrSeasonsCache[`${server.id}-${media.tvdbId}`] = meta.seasons;
      // console.log({
      //   seasonsCache: this.sonarrSeasonsCache[`${server.id}-${media.tvdbId}`],
      // });
      // console.log({ status4k: media.status4k });
      if (!server.is4k && !meta.id) {
        existsInSonarr = false;
      }
      // console.log({ status: media.status });
      if (server.is4k && !meta.id) {
        existsInSonarr4k = false;
      }
    }

    if (existsInSonarr && existsInSonarr4k) {
      return true;
    }

    if (!existsInSonarr && existsInSonarr4k) {
      if (media.status !== MediaStatus.UNKNOWN) {
        logger.debug(
          `${media.tmdbId} does not exist in your non-4k sonarr instance so we will change it's status to unknown`,
          { label: 'AvailabilitySync' }
        );
        await mediaRepository.update(media.id, {
          status: MediaStatus.UNKNOWN,
          serviceId: null,
          externalServiceId: null,
          externalServiceSlug: null,
          ratingKey: null,
        });
        // requestRepository.delete({ id: request?.id });
      }
      return true;
    }

    if (existsInSonarr && !existsInSonarr4k) {
      if (media.status4k !== MediaStatus.UNKNOWN) {
        logger.debug(
          `${media.tmdbId} does not exist in your 4k sonarr instance so we will change it's status to unknown`,
          { label: 'AvailabilitySync' }
        );
        await mediaRepository.update(media.id, {
          status4k: MediaStatus.UNKNOWN,
          serviceId4k: null,
          externalServiceId4k: null,
          externalServiceSlug4k: null,
          ratingKey4k: null,
        });
        // requestRepository.delete({ id: request4k?.id });
      }
      return true;
    }
    return false;
  }

  private async seasonExistsInSonarr(media: Media, season: Season) {
    if (!media.tvdbId) {
      return false;
    }

    let seasonExistsInSonarr = true;
    let seasonExistsInSonarr4k = true;

    const mediaRepository = getRepository(Media);
    const seasonRepository = getRepository(Season);
    const seasonRequestRepository = getRepository(SeasonRequest);
    // const requestRepository = getRepository(MediaRequest);

    // const seasonRequest4k = await requestRepository.findOne({
    //   where: { media: { id: media.id }, is4k: true },
    // });

    // const deletableRequests = seasonRequest?.seasons.length === 0

    // await requestRepository.delete({
    //   media: { id: media.id, seasons: Not(In([])) },
    // });

    for (const server of this.sonarrServers) {
      const api = new SonarrAPI({
        apiKey: server.apiKey,
        url: SonarrAPI.buildUrl(server, '/api/v3'),
      });

      // console.log({ server: server.id });
      // console.log({ media: media.tvdbId });

      const seasons =
        this.sonarrSeasonsCache[`${server.id}-${media.tvdbId}`] ??
        (await api.getSeriesByTvdbId(media.tvdbId)).seasons;
      this.sonarrSeasonsCache[`${server.id}-${media.tvdbId}`] = seasons;

      const hasMonitoredSeason = seasons.find(
        ({ monitored, seasonNumber }) =>
          monitored && season.seasonNumber === seasonNumber
      );

      // console.log({ status4k: media.status4k });
      if (!server.is4k && !hasMonitoredSeason) {
        seasonExistsInSonarr = false;
      }
      // console.log({ status: media.status });
      if (server.is4k && !hasMonitoredSeason) {
        seasonExistsInSonarr4k = false;
      }
    }

    // const mediaRequest = await requestRepository.findOne({
    //   where: {
    //     media: { id: media.id },
    //     is4k: seasonExistsInSonarr ? true : false,
    //   },
    // });

    if (seasonExistsInSonarr && seasonExistsInSonarr4k) {
      return true;
    }

    if (!seasonExistsInSonarr && seasonExistsInSonarr4k) {
      if (season.status !== MediaStatus.UNKNOWN) {
        logger.debug(
          `${media.tvdbId}, season: ${season.seasonNumber} does not exist in your non-4k sonarr instance so we will change it's status to unknown`,
          { label: 'AvailabilitySync' }
        );
        await seasonRepository.update(season.id, {
          status: MediaStatus.UNKNOWN,
        });
        // console.log('non-4k', { mediaRequest });

        const seasonToBeDeleted = await seasonRequestRepository.findOne({
          relations: {
            request: {
              media: true,
            },
          },
          where: {
            request: {
              is4k: false,
              media: {
                id: media.id,
              },
            },
            seasonNumber: season.seasonNumber,
          },
        });

        if (seasonToBeDeleted) {
          await seasonRequestRepository.remove(seasonToBeDeleted);
        }

        if (season.status === MediaStatus.AVAILABLE) {
          logger.debug(
            `Marking media id: ${media.tmdbId} as PARTIALLY_AVAILABLE because we deleted one of it's seasons`,
            { label: 'AvailabilitySync' }
          );
          await mediaRepository.update(media.id, {
            status: MediaStatus.PARTIALLY_AVAILABLE,
          });
        }
      }
      return true;
    }

    if (seasonExistsInSonarr && !seasonExistsInSonarr4k) {
      if (season.status4k !== MediaStatus.UNKNOWN) {
        logger.debug(
          `${media.tvdbId}, season: ${season.seasonNumber} does not exist in your 4k sonarr instance so we will change it's status to unknown`,
          { label: 'AvailabilitySync' }
        );
        await seasonRepository.update(season.id, {
          status4k: MediaStatus.UNKNOWN,
        });
        // console.log('4k', { mediaRequest });

        const seasonToBeDeleted4k = await seasonRequestRepository.findOne({
          relations: {
            request: {
              media: true,
            },
          },
          where: {
            request: {
              is4k: true,
              media: {
                id: media.id,
              },
            },
            seasonNumber: season.seasonNumber,
          },
        });

        if (seasonToBeDeleted4k) {
          await seasonRequestRepository.remove(seasonToBeDeleted4k);
        }

        if (season.status4k === MediaStatus.AVAILABLE) {
          logger.debug(
            `Marking media id: ${media.tmdbId} as PARTIALLY_AVAILABLE because we deleted one of it's seasons`,
            { label: 'AvailabilitySync' }
          );
          await mediaRepository.update(media.id, {
            status4k: MediaStatus.PARTIALLY_AVAILABLE,
          });
        }
      }
      return true;
    }

    return false;
  }

  private async seasonExists(media: Media, season: Season): Promise<boolean> {
    if (await this.seasonExistsInPlex(media, season)) {
      return true;
    }

    const existsInSonarr = await this.seasonExistsInSonarr(media, season);
    if (existsInSonarr) {
      logger.warn(
        `${media.tvdbId}, season: ${season.seasonNumber} exists in at least one sonarr instance but is missing from plex, so we'll assume it's still supposed to exist.`,
        {
          label: 'AvailabilitySync',
        }
      );
      return true;
    }
    return false;
  }

  private async mediaExists(media: Media): Promise<boolean> {
    // console.log({ media });

    if (await this.mediaExistsInPlex(media)) {
      return true;
    }

    if (media.mediaType === 'movie') {
      const existsInRadarr = await this.mediaExistsInRadarr(media);
      if (existsInRadarr) {
        logger.warn(
          `${media.tmdbId} exists in at least one radarr instance but is missing from plex, so we'll assume it's still supposed to exist.`,
          {
            label: 'AvailabilitySync',
          }
        );
        return true;
      }
    }

    if (media.mediaType === 'tv') {
      const existsInSonarr = await this.mediaExistsInSonarr(media);
      if (existsInSonarr) {
        logger.warn(
          `${media.tmdbId} exists in at least one sonarr instance but is missing from plex, so we'll assume it's still supposed to exist.`,
          {
            label: 'AvailabilitySync',
          }
        );
        return true;
      }
    }

    return false;
  }
}

const availabilitySync = new AvailabilitySync();
export default availabilitySync;
