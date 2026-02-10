import TautulliAPI from '@server/api/tautulli';
import RadarrAPI from '@server/api/servarr/radarr';
import SonarrAPI from '@server/api/servarr/sonarr';
import { MediaStatus, MediaType } from '@server/constants/media';
import { getRepository } from '@server/datasource';
import Media from '@server/entity/Media';
import Season from '@server/entity/Season';
import { User } from '@server/entity/User';
import type {
  MediaResultsResponse,
  MediaWatchDataResponse,
} from '@server/interfaces/api/mediaInterfaces';
import { Permission } from '@server/lib/permissions';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { isAuthenticated } from '@server/middleware/auth';
import { Router } from 'express';
import type { FindOneOptions } from 'typeorm';
import { In } from 'typeorm';

const mediaRoutes = Router();

mediaRoutes.get('/', async (req, res, next) => {
  const mediaRepository = getRepository(Media);

  const pageSize = req.query.take ? Number(req.query.take) : 20;
  const skip = req.query.skip ? Number(req.query.skip) : 0;

  let statusFilter = undefined;

  switch (req.query.filter) {
    case 'available':
      statusFilter = MediaStatus.AVAILABLE;
      break;
    case 'partial':
      statusFilter = MediaStatus.PARTIALLY_AVAILABLE;
      break;
    case 'allavailable':
      statusFilter = In([
        MediaStatus.AVAILABLE,
        MediaStatus.PARTIALLY_AVAILABLE,
      ]);
      break;
    case 'processing':
      statusFilter = MediaStatus.PROCESSING;
      break;
    case 'pending':
      statusFilter = MediaStatus.PENDING;
      break;
    default:
      statusFilter = undefined;
  }

  let sortFilter: FindOneOptions<Media>['order'] = {
    id: 'DESC',
  };

  switch (req.query.sort) {
    case 'modified':
      sortFilter = {
        updatedAt: 'DESC',
      };
      break;
    case 'mediaAdded':
      sortFilter = {
        mediaAddedAt: 'DESC',
      };
  }

  try {
    const [media, mediaCount] = await mediaRepository.findAndCount({
      order: sortFilter,
      where: statusFilter && {
        status: statusFilter,
      },
      take: pageSize,
      skip,
    });
    return res.status(200).json({
      pageInfo: {
        pages: Math.ceil(mediaCount / pageSize),
        pageSize,
        results: mediaCount,
        page: Math.ceil(skip / pageSize) + 1,
      },
      results: media,
    } as MediaResultsResponse);
  } catch (e) {
    next({ status: 500, message: e.message });
  }
});

mediaRoutes.post<
  {
    id: string;
    status: 'available' | 'partial' | 'processing' | 'pending' | 'unknown';
  },
  Media
>(
  '/:id/:status',
  isAuthenticated(Permission.MANAGE_REQUESTS),
  async (req, res, next) => {
    const mediaRepository = getRepository(Media);
    const seasonRepository = getRepository(Season);

    const media = await mediaRepository.findOne({
      where: { id: Number(req.params.id) },
    });

    if (!media) {
      return next({ status: 404, message: 'Media does not exist.' });
    }

    const is4k = Boolean(req.body.is4k);

    switch (req.params.status) {
      case 'available':
        media[is4k ? 'status4k' : 'status'] = MediaStatus.AVAILABLE;

        if (media.mediaType === MediaType.TV) {
          const expectedSeasons = req.body.seasons ?? [];

          for (const expectedSeason of expectedSeasons) {
            let season = media.seasons.find(
              (s) => s.seasonNumber === expectedSeason?.seasonNumber
            );

            if (!season) {
              // Create the season if it doesn't exist
              season = seasonRepository.create({
                seasonNumber: expectedSeason?.seasonNumber,
              });
              media.seasons.push(season);
            }

            season[is4k ? 'status4k' : 'status'] = MediaStatus.AVAILABLE;
          }
        }
        break;
      case 'partial':
        if (media.mediaType === MediaType.MOVIE) {
          return next({
            status: 400,
            message: 'Only series can be set to be partially available',
          });
        }
        media.status = MediaStatus.PARTIALLY_AVAILABLE;
        break;
      case 'processing':
        media.status = MediaStatus.PROCESSING;
        break;
      case 'pending':
        media.status = MediaStatus.PENDING;
        break;
      case 'unknown':
        media.status = MediaStatus.UNKNOWN;
    }

    await mediaRepository.save(media);

    return res.status(200).json(media);
  }
);

mediaRoutes.delete(
  '/:id',
  isAuthenticated(Permission.MANAGE_REQUESTS),
  async (req, res, next) => {
    try {
      const mediaRepository = getRepository(Media);

      const media = await mediaRepository.findOneOrFail({
        where: { id: Number(req.params.id) },
      });

      await mediaRepository.remove(media);

      return res.status(204).send();
    } catch (e) {
      logger.error('Something went wrong fetching media in delete request', {
        label: 'Media',
        message: e.message,
      });
      next({ status: 404, message: 'Media not found' });
    }
  }
);

mediaRoutes.get<{ id: string }, MediaWatchDataResponse>(
  '/:id/watch_data',
  isAuthenticated(Permission.ADMIN),
  async (req, res, next) => {
    const settings = getSettings().tautulli;

    if (!settings.hostname || !settings.port || !settings.apiKey) {
      return next({
        status: 404,
        message: 'Tautulli API not configured.',
      });
    }

    const media = await getRepository(Media).findOne({
      where: { id: Number(req.params.id) },
    });

    if (!media) {
      return next({ status: 404, message: 'Media does not exist.' });
    }

    try {
      const tautulli = new TautulliAPI(settings);
      const userRepository = getRepository(User);

      const response: MediaWatchDataResponse = {};

      if (media.ratingKey) {
        const watchStats = await tautulli.getMediaWatchStats(media.ratingKey);
        const watchUsers = await tautulli.getMediaWatchUsers(media.ratingKey);

        const users = await userRepository
          .createQueryBuilder('user')
          .where('user.plexId IN (:...plexIds)', {
            plexIds: watchUsers.map((u) => u.user_id),
          })
          .getMany();

        const playCount =
          watchStats.find((i) => i.query_days == 0)?.total_plays ?? 0;

        const playCount7Days =
          watchStats.find((i) => i.query_days == 7)?.total_plays ?? 0;

        const playCount30Days =
          watchStats.find((i) => i.query_days == 30)?.total_plays ?? 0;

        response.data = {
          users: users,
          playCount,
          playCount7Days,
          playCount30Days,
        };
      }

      if (media.ratingKey4k) {
        const watchStats4k = await tautulli.getMediaWatchStats(
          media.ratingKey4k
        );
        const watchUsers4k = await tautulli.getMediaWatchUsers(
          media.ratingKey4k
        );

        const users = await userRepository
          .createQueryBuilder('user')
          .where('user.plexId IN (:...plexIds)', {
            plexIds: watchUsers4k.map((u) => u.user_id),
          })
          .getMany();

        const playCount =
          watchStats4k.find((i) => i.query_days == 0)?.total_plays ?? 0;

        const playCount7Days =
          watchStats4k.find((i) => i.query_days == 7)?.total_plays ?? 0;

        const playCount30Days =
          watchStats4k.find((i) => i.query_days == 30)?.total_plays ?? 0;

        response.data4k = {
          users,
          playCount,
          playCount7Days,
          playCount30Days,
        };
      }

      return res.status(200).json(response);
    } catch (e) {
      logger.error('Something went wrong fetching media watch data', {
        label: 'API',
        errorMessage: e.message,
        mediaId: req.params.id,
      });
      next({ status: 500, message: 'Failed to fetch watch data.' });
    }
  }
);

mediaRoutes.post<
  { id: string },
  { success: boolean; message: string },
  { is4k?: boolean; seasons?: number[]; episodeIds?: number[] }
>(
  '/:id/redownload',
  isAuthenticated(Permission.RE_DOWNLOAD),
  async (req, res, next) => {
    try {
      const mediaRepository = getRepository(Media);
      const media = await mediaRepository.findOne({
        where: { id: Number(req.params.id) },
        relations: { requests: true },
      });

      if (!media) {
        return next({ status: 404, message: 'Media does not exist.' });
      }

      const is4k = Boolean(req.body.is4k);
      const serviceId = media[is4k ? 'serviceId4k' : 'serviceId'];
      const externalServiceId = media[is4k ? 'externalServiceId4k' : 'externalServiceId'];

      if (!serviceId || !externalServiceId) {
        return next({
          status: 400,
          message: `Media is not configured in ${media.mediaType === MediaType.MOVIE ? 'Radarr' : 'Sonarr'}.`,
        });
      }

      const settings = getSettings();

      if (media.mediaType === MediaType.MOVIE) {
        // For movies, trigger Radarr search
        const radarrSettings = settings.radarr.find(
          (r) => r.id === serviceId
        );

        if (!radarrSettings) {
          return next({
            status: 500,
            message: 'Radarr server configuration not found.',
          });
        }

        const radarr = new RadarrAPI({
          url: radarrSettings.useSsl
            ? `https://${radarrSettings.hostname}:${radarrSettings.port}${radarrSettings.baseUrl ?? ''}`
            : `http://${radarrSettings.hostname}:${radarrSettings.port}${radarrSettings.baseUrl ?? ''}`,
          apiKey: radarrSettings.apiKey,
        });

        // Get the movie details to check for existing files
        try {
          const movie = await radarr.getMovie({ id: externalServiceId });
          
          // Delete existing file if it exists
          if (movie.hasFile && movie.movieFile?.id) {
            logger.info('Deleting existing movie file before re-download', {
              label: 'Media',
              movieId: externalServiceId,
              movieFileId: movie.movieFile.id,
            });
            await radarr.deleteMovieFile(movie.movieFile.id);
          }
        } catch (e) {
          logger.warn('Could not delete existing movie file, continuing with search', {
            label: 'Media',
            errorMessage: e.message,
          });
        }

        await radarr.searchMovie(externalServiceId);

        return res.status(200).json({
          success: true,
          message: 'Movie re-download initiated.',
        });
      } else {
        // For TV shows, trigger Sonarr search
        const sonarrSettings = settings.sonarr.find(
          (s) => s.id === serviceId
        );

        if (!sonarrSettings) {
          return next({
            status: 500,
            message: 'Sonarr server configuration not found.',
          });
        }

        const sonarr = new SonarrAPI({
          url: sonarrSettings.useSsl
            ? `https://${sonarrSettings.hostname}:${sonarrSettings.port}${sonarrSettings.baseUrl ?? ''}`
            : `http://${sonarrSettings.hostname}:${sonarrSettings.port}${sonarrSettings.baseUrl ?? ''}`,
          apiKey: sonarrSettings.apiKey,
        });

        // Delete existing episode files before re-downloading
        try {
          const episodeFileIds = await sonarr.getEpisodeFiles(externalServiceId);
          
          if (episodeFileIds.length > 0) {
            logger.info('Deleting existing episode files before re-download', {
              label: 'Media',
              seriesId: externalServiceId,
              fileCount: episodeFileIds.length,
            });
            await sonarr.deleteEpisodeFiles(episodeFileIds);
          }
        } catch (e) {
          logger.warn('Could not delete existing episode files, continuing with search', {
            label: 'Media',
            errorMessage: e.message,
          });
        }

        if (req.body.seasons && req.body.seasons.length > 0) {
          // Search specific seasons
          for (const seasonNumber of req.body.seasons) {
            await sonarr.searchSeason(externalServiceId, seasonNumber);
          }
          return res.status(200).json({
            success: true,
            message: `Re-download initiated for ${req.body.seasons.length} season(s).`,
          });
        } else if (req.body.episodeIds && req.body.episodeIds.length > 0) {
          // Search specific episodes
          await sonarr.searchEpisodes(req.body.episodeIds);
          return res.status(200).json({
            success: true,
            message: `Re-download initiated for ${req.body.episodeIds.length} episode(s).`,
          });
        } else {
          // Search entire series
          await sonarr.searchSeries(externalServiceId);
          return res.status(200).json({
            success: true,
            message: 'Series re-download initiated.',
          });
        }
      }
    } catch (e) {
      logger.error('Something went wrong initiating re-download', {
        label: 'Media',
        message: e.message,
      });
      next({ status: 500, message: 'Failed to initiate re-download.' });
    }
  }
);

export default mediaRoutes;
