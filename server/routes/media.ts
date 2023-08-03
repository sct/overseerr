import TautulliAPI from '@server/api/tautulli';
import { MediaStatus, MediaType } from '@server/constants/media';
import { getRepository } from '@server/datasource';
import TheMovieDb from '@server/api/themoviedb';
import Media from '@server/entity/Media';
import { MediaRequest } from '@server/entity/MediaRequest';
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

mediaRoutes.get('/continuewatching', async (req, res, next) => {

  const mediaRepository = getRepository(Media);

  const page = req.query.page ? Number(req.query.page) : 1;

  const pageSize = 20;
  const skip = (page * pageSize) - pageSize;

  const tmdb = new TheMovieDb();
  const tmdbinfos = []

  try {
    const requests = await getRepository(MediaRequest).createQueryBuilder('request')
      .leftJoinAndSelect('request.media', 'media')
      .where('request.media IS NOT NULL')
      .getMany();

    const seasons_available = await getRepository(Season).createQueryBuilder('season')
      .leftJoinAndSelect('season.media', 'media')
      .where('season.status < :status', { status: MediaStatus.AVAILABLE })
      .andWhere('season.media IS NOT NULL')
      .getMany();

    const seasons_already = await getRepository(Season).createQueryBuilder('season')
      .leftJoinAndSelect('season.media', 'media')
      .where('season.status > :status', { status: MediaStatus.UNKNOWN })
      .andWhere('season.media IS NOT NULL')
      .getMany();

    // SET MEDIA TO AVAILABLE IF NO SEASON ARE ARVAILABLE -- START
    const mediaPartially = await mediaRepository.createQueryBuilder('media')
      .where('media.status = :statusMedia AND media.tmdbId NOT IN (:...tmdbIds)', {
        tmdbIds: requests.map((request) => request.media.tmdbId),
        statusMedia: MediaStatus.PARTIALLY_AVAILABLE
      })
      .getMany();

    mediaPartially.forEach(media => {
      if (!seasons_available.map((season) => season.media.tmdbId).includes(media.tmdbId)) {
        media.status = MediaStatus.AVAILABLE;
        mediaRepository.save(media)
        logger.info(media.tmdbId + ': Change media status to available')
      }
    });
    // SET MEDIA TO AVAILABLE IF NO SEASON ARE ARVAILABLE -- END

    // KEEP SEASON IF NUMBER OF EPISODE > 0 -- START
    let media_seasons = await mediaRepository.createQueryBuilder('media')
      .where('media.tmdbId NOT IN (:...tmdbIds) AND media.tmdbId IN (:...tmdbIds1) AND media.tmdbId IN (:...tmdbIds2)', {
        tmdbIds: requests.map((request) => request.media.tmdbId),
        tmdbIds1: seasons_available.map((season) => season.media.tmdbId),
        tmdbIds2: seasons_already.map((season) => season.media.tmdbId),
      })
      .getMany();

    for (let m in media_seasons) {
      tmdbinfos[media_seasons[m].tmdbId] = await tmdb.getTvShow({ tvId: media_seasons[m].tmdbId, language: req.locale ?? (req.query.language as string) });

      const season_with_episodes: number[] = []
      tmdbinfos[media_seasons[m].tmdbId].seasons.forEach(season => {
        if (season.episode_count > 0) {
          season_with_episodes.push(season.season_number)
        }
      });

      seasons_available.forEach((season, index) => {
        if (season.media.tmdbId == media_seasons[m].tmdbId) {
          if (!season_with_episodes.includes(season.seasonNumber)) {
            logger.info(season.media.tmdbId + ': Season ' + season.seasonNumber + ' have 0 episode.')
            seasons_available.splice(index, 1);
          }
        }
      });
    }
    // KEEP SEASON IF NUMBER OF EPISODE > 0 -- END

    const [media, mediaCount] = await mediaRepository.createQueryBuilder('media')
      .where('media.tmdbId NOT IN (:...tmdbIds) AND media.tmdbId IN (:...tmdbIds1) AND media.tmdbId IN (:...tmdbIds2)', {
        tmdbIds: requests.map((request) => request.media.tmdbId),
        tmdbIds1: seasons_available.map((season) => season.media.tmdbId),
        tmdbIds2: seasons_already.map((season) => season.media.tmdbId),
      })
      .orderBy('media.tmdbId', 'DESC')
      .take(pageSize)
      .skip(skip)
      .getManyAndCount();

    const infos = []
    for (let m in media) {
      let data = {
        id: media[m].tmdbId,
        mediaType: media[m].mediaType,
        originalLanguage: tmdbinfos[media[m].tmdbId].original_language,
        originalName: tmdbinfos[media[m].tmdbId].original_name,
        overview: tmdbinfos[media[m].tmdbId].overview,
        popularity: tmdbinfos[media[m].tmdbId].popularity,
        name: tmdbinfos[media[m].tmdbId].name,
        voteAverage: tmdbinfos[media[m].tmdbId].vote_average,
        voteCount: tmdbinfos[media[m].tmdbId].vote_count,
        backdropPath: tmdbinfos[media[m].tmdbId].backdrop_path,
        posterPath: tmdbinfos[media[m].tmdbId].poster_path,
        mediaInfo: media[m]
      }
      infos.push(data)
    }

    return res.status(200).json({
      page: page,
      totalPages: Math.ceil(mediaCount / pageSize),
      totalResults: mediaCount,
      results: infos,
    });
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
          // Mark all seasons available
          media.seasons.forEach((season) => {
            season[is4k ? 'status4k' : 'status'] = MediaStatus.AVAILABLE;
          });
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

export default mediaRoutes;
