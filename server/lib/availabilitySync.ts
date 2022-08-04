import type { PlexMetadata } from '@server/api/plexapi';
import PlexAPI from '@server/api/plexapi';
import RadarrAPI from '@server/api/servarr/radarr';
import type { SonarrSeason } from '@server/api/servarr/sonarr';
import SonarrAPI from '@server/api/servarr/sonarr';
import { MediaStatus } from '@server/constants/media';
import { getRepository } from '@server/datasource';
import Media from '@server/entity/Media';
import Season from '@server/entity/Season';
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
    await this.initPlexClient();

    if (!this.plexClient) {
      return;
    }

    logger.debug(`Starting availability sync...`, {
      label: 'AvailabilitySync',
    });

    try {
      const mediaRepository = getRepository(Media);
      const seasonRepository = getRepository(Season);
      const availableMedia = await mediaRepository.find({
        where: [
          {
            status: MediaStatus.AVAILABLE,
          },
          {
            status: MediaStatus.PARTIALLY_AVAILABLE,
          },
          {
            status4k: MediaStatus.AVAILABLE,
          },
          {
            status4k: MediaStatus.PARTIALLY_AVAILABLE,
          },
        ],
      });

      for (const media of availableMedia) {
        if (!this.running) {
          throw new Error('Job aborted');
        }

        const mediaExists = await this.mediaExists(media);

        if (!mediaExists) {
          logger.debug(
            `Removing media id: ${media.tmdbId} because it doesn't appear in any of the libraries anymore`,
            {
              label: 'AvailabilitySync',
            }
          );
          await mediaRepository.delete(media.id);
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

          let didDeleteSeasons = false;
          for (const season of seasons) {
            const seasonExists = await this.seasonExists(media, season);

            if (!seasonExists) {
              logger.debug(
                `Removing ${season.seasonNumber} for media id: ${media.tmdbId} because it doesn't appear in any of the libraries anymore`,
                {
                  label: 'AvailabilitySync',
                }
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
                {
                  label: 'AvailabilitySync',
                }
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
    } catch (ex) {
      logger.error('Failed to complete availability sync', {
        errorMessage: ex.message,
        label: 'AvailabilitySync',
      });
    } finally {
      logger.debug(`Availability sync complete`, {
        label: 'AvailabilitySync',
      });
      this.running = false;
    }
  }

  private async mediaExists(media: Media): Promise<boolean> {
    if (await this.mediaExistsInPlex(media)) {
      return true;
    }

    if (media.mediaType === 'movie') {
      const existsInRadarr = await this.mediaExistsInRadarr(media);
      if (existsInRadarr) {
        logger.warn(
          `${media.tmdbId} exists in radarr (${media.serviceUrl}) but is missing from plex, so we'll assume it's still supposed to exist.`,
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
          `${media.tvdbId} exists in sonarr (${media.serviceUrl}) but is missing from plex, so we'll assume it's still supposed to exist.`,
          {
            label: 'AvailabilitySync',
          }
        );
        return true;
      }
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
        `${media.tvdbId}, season: ${season.seasonNumber} exists in sonarr (${media.serviceUrl}) but is missing from plex, so we'll assume it's still supposed to exist.`,
        {
          label: 'AvailabilitySync',
        }
      );
      return true;
    }
    return false;
  }

  private async mediaExistsInRadarr(media: Media): Promise<boolean> {
    for (const server of this.radarrServers) {
      const api = new RadarrAPI({
        apiKey: server.apiKey,
        url: RadarrAPI.buildUrl(server, '/api/v3'),
      });
      const meta = await api.getMovieByTmdbId(media.tmdbId);
      if (meta.id) {
        return true;
      }
    }
    return false;
  }

  private async mediaExistsInSonarr(media: Media): Promise<boolean> {
    if (!media.tvdbId) {
      return false;
    }

    for (const server of this.sonarrServers) {
      const api = new SonarrAPI({
        apiKey: server.apiKey,
        url: SonarrAPI.buildUrl(server, '/api/v3'),
      });
      const meta = await api.getSeriesByTvdbId(media.tvdbId);
      this.sonarrSeasonsCache[`${server.id}-${media.tvdbId}`] = meta.seasons;
      if (meta.id && meta.monitored) {
        return true;
      }
    }
    return false;
  }

  private async mediaExistsInPlex(media: Media): Promise<boolean> {
    const ratingKey = media.ratingKey ?? media.ratingKey4k;

    if (!ratingKey) {
      return false;
    }

    try {
      const meta = await this.plexClient?.getMetadata(ratingKey);
      return !!meta;
    } catch (ex) {
      // TODO: oof, not the nicest way of handling this, but plex-api does not leave us with any other options...
      if (!ex.message.includes('response code: 404')) {
        throw ex;
      }

      return false;
    }
  }

  private async seasonExistsInPlex(media: Media, season: Season) {
    const ratingKey = media.ratingKey ?? media.ratingKey4k;

    if (!ratingKey) {
      return false;
    }

    const children =
      this.plexSeasonsCache[ratingKey] ??
      (await this.plexClient?.getChildrenMetadata(ratingKey)) ??
      [];
    this.plexSeasonsCache[ratingKey] = children;

    const seasonMeta = children.find(
      (child) => child.index === season.seasonNumber
    );

    return !!seasonMeta;
  }

  private async seasonExistsInSonarr(media: Media, season: Season) {
    if (!media.tvdbId) {
      return false;
    }

    for (const server of this.sonarrServers) {
      const api = new SonarrAPI({
        apiKey: server.apiKey,
        url: SonarrAPI.buildUrl(server, '/api/v3'),
      });
      const seasons =
        this.sonarrSeasonsCache[`${server.id}-${media.tvdbId}`] ??
        (await api.getSeriesByTvdbId(media.tvdbId)).seasons;
      this.sonarrSeasonsCache[`${server.id}-${media.tvdbId}`] = seasons;

      const hasMonitoredSeason = seasons.find(
        ({ monitored, seasonNumber }) =>
          monitored && season.seasonNumber === seasonNumber
      );
      if (hasMonitoredSeason) {
        return true;
      }
    }

    return false;
  }

  private async initPlexClient() {
    const userRepository = getRepository(User);
    const admin = await userRepository.findOne({
      select: ['id', 'plexToken'],
      order: { id: 'ASC' },
    });

    if (!admin) {
      logger.warning(
        'No plex admin configured. Availability sync will not be ran'
      );
      return;
    }

    this.plexClient = new PlexAPI({ plexToken: admin.plexToken });
  }

  public cancel() {
    this.running = false;
  }
}

const availabilitySync = new AvailabilitySync();
export default availabilitySync;
