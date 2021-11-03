import { Router } from 'express';
import { uniqBy } from 'lodash';
import moment from 'moment';
import { FindOneOptions, FindOperator, getRepository, In } from 'typeorm';
import TautulliAPI, { parseDuration } from '../api/tautulli';
import { MediaStatus, MediaType } from '../constants/media';
import Media from '../entity/Media';
import { User } from '../entity/User';
import {
  MediaResultsResponse,
  MediaWatchHistoryResponse,
} from '../interfaces/api/mediaInterfaces';
import { Permission } from '../lib/permissions';
import { getSettings } from '../lib/settings';
import logger from '../logger';
import { isAuthenticated } from '../middleware/auth';

const mediaRoutes = Router();

mediaRoutes.get('/', async (req, res, next) => {
  const mediaRepository = getRepository(Media);

  const pageSize = req.query.take ? Number(req.query.take) : 20;
  const skip = req.query.skip ? Number(req.query.skip) : 0;

  let statusFilter: MediaStatus | FindOperator<MediaStatus> | undefined =
    undefined;

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
      where: {
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
        where: { id: req.params.id },
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

mediaRoutes.get<{ id: string }, MediaWatchHistoryResponse>(
  '/:id/watch_history',
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

      const response: MediaWatchHistoryResponse = {};
      moment.locale(req.locale ?? 'en');

      if (media.ratingKey) {
        const watchHistory = await tautulli.getMediaWatchHistory(
          MediaType.TV,
          media.ratingKey
        );
        const uniqueUserIds = uniqBy(watchHistory.data, 'user_id').map(
          (record) => record.user_id
        );
        const users = (
          await Promise.all(
            uniqueUserIds.map(async (userId) => {
              const tautulliUser = await tautulli.getUser(userId.toString());

              if (tautulliUser.email) {
                return await userRepository
                  .createQueryBuilder('user')
                  .where('user.email = :email', {
                    email: tautulliUser.email.toLowerCase(),
                  })
                  .getOne();
              }
            })
          )
        ).filter((user) => !!user) as User[];

        response.data = {
          playCount: watchHistory.recordsFiltered,
          playDuration: moment
            .duration(parseDuration(watchHistory.total_duration), 'seconds')
            .humanize(),
          userCount: uniqueUserIds.length,
          users,
        };
      }

      if (media.ratingKey4k) {
        const watchHistory4k = await tautulli.getMediaWatchHistory(
          MediaType.TV,
          media.ratingKey4k
        );
        const uniqueUserIds4k = uniqBy(watchHistory4k.data, 'user_id').map(
          (record) => record.user_id
        );
        const users4k = (
          await Promise.all(
            uniqueUserIds4k.map(async (userId) => {
              const tautulliUser = await tautulli.getUser(userId.toString());

              if (tautulliUser.email) {
                return await userRepository
                  .createQueryBuilder('user')
                  .where('user.email = :email', {
                    email: tautulliUser.email.toLowerCase(),
                  })
                  .getOne();
              }
            })
          )
        ).filter((user) => !!user) as User[];

        response.data4k = {
          playCount: watchHistory4k.recordsFiltered,
          playDuration: moment
            .duration(parseDuration(watchHistory4k.total_duration), 'seconds')
            .humanize(),
          userCount: uniqueUserIds4k.length,
          users: users4k,
        };
      }

      return res.status(200).json(response);
    } catch (e) {
      next({ status: 500, message: 'Failed to fetch watch history.' });
    }
  }
);

export default mediaRoutes;
