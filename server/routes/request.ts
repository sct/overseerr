import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth';
import { Permission } from '../lib/permissions';
import { getRepository, FindOperator, FindOneOptions, In } from 'typeorm';
import { MediaRequest } from '../entity/MediaRequest';
import TheMovieDb from '../api/themoviedb';
import Media from '../entity/Media';
import { MediaStatus, MediaRequestStatus, MediaType } from '../constants/media';
import SeasonRequest from '../entity/SeasonRequest';
import logger from '../logger';
import { RequestResultsResponse } from '../interfaces/api/requestInterfaces';

const requestRoutes = Router();

requestRoutes.get('/', async (req, res, next) => {
  const requestRepository = getRepository(MediaRequest);
  try {
    const pageSize = req.query.take ? Number(req.query.take) : 20;
    const skip = req.query.skip ? Number(req.query.skip) : 0;

    let statusFilter:
      | MediaRequestStatus
      | FindOperator<string | MediaRequestStatus>
      | undefined = undefined;

    switch (req.query.filter) {
      case 'available':
        statusFilter = MediaRequestStatus.AVAILABLE;
        break;
      case 'approved':
        statusFilter = MediaRequestStatus.APPROVED;
        break;
      case 'pending':
        statusFilter = MediaRequestStatus.PENDING;
        break;
      case 'unavailable':
        statusFilter = In([
          MediaRequestStatus.PENDING,
          MediaRequestStatus.APPROVED,
        ]);
        break;
      default:
        statusFilter = In(Object.values(MediaRequestStatus));
    }

    let sortFilter: FindOneOptions<MediaRequest>['order'] = {
      id: 'DESC',
    };

    switch (req.query.sort) {
      case 'modified':
        sortFilter = {
          updatedAt: 'DESC',
        };
        break;
    }

    const [requests, requestCount] = req.user?.hasPermission(
      Permission.MANAGE_REQUESTS
    )
      ? await requestRepository.findAndCount({
          order: sortFilter,
          relations: ['media', 'modifiedBy'],
          where: { status: statusFilter },
          take: Number(req.query.take) ?? 20,
          skip,
        })
      : await requestRepository.findAndCount({
          where: { requestedBy: { id: req.user?.id }, status: statusFilter },
          relations: ['media', 'modifiedBy'],
          order: sortFilter,
          take: Number(req.query.limit) ?? 20,
          skip,
        });

    return res.status(200).json({
      pageInfo: {
        pages: Math.ceil(requestCount / pageSize),
        pageSize,
        results: requestCount,
        page: Math.ceil(skip / pageSize) + 1,
      },
      results: requests,
    } as RequestResultsResponse);
  } catch (e) {
    next({ status: 500, message: e.message });
  }
});

requestRoutes.post(
  '/',
  isAuthenticated(Permission.REQUEST),
  async (req, res, next) => {
    const tmdb = new TheMovieDb();
    const mediaRepository = getRepository(Media);
    const requestRepository = getRepository(MediaRequest);

    try {
      const tmdbMedia =
        req.body.mediaType === 'movie'
          ? await tmdb.getMovie({ movieId: req.body.mediaId })
          : await tmdb.getTvShow({ tvId: req.body.mediaId });

      let media = await mediaRepository.findOne({
        where: { tmdbId: req.body.mediaId, mediaType: req.body.mediaType },
        relations: ['requests'],
      });

      if (!media) {
        media = new Media({
          tmdbId: tmdbMedia.id,
          tvdbId: tmdbMedia.external_ids.tvdb_id,
          status: MediaStatus.PENDING,
          mediaType: req.body.mediaType,
        });
        await mediaRepository.save(media);
      } else {
        if (media.status === MediaStatus.UNKNOWN) {
          media.status = MediaStatus.PENDING;
          await mediaRepository.save(media);
        }
      }

      if (req.body.mediaType === 'movie') {
        const request = new MediaRequest({
          type: MediaType.MOVIE,
          media,
          requestedBy: req.user,
          // If the user is an admin or has the "auto approve" permission, automatically approve the request
          status:
            req.user?.hasPermission(Permission.AUTO_APPROVE) ||
            req.user?.hasPermission(Permission.AUTO_APPROVE_MOVIE)
              ? MediaRequestStatus.APPROVED
              : MediaRequestStatus.PENDING,
          modifiedBy:
            req.user?.hasPermission(Permission.AUTO_APPROVE) ||
            req.user?.hasPermission(Permission.AUTO_APPROVE_MOVIE)
              ? req.user
              : undefined,
        });

        await requestRepository.save(request);
        return res.status(201).json(request);
      } else if (req.body.mediaType === 'tv') {
        const requestedSeasons = req.body.seasons as number[];
        let existingSeasons: number[] = [];

        // We need to check existing requests on this title to make sure we don't double up on seasons that were
        // already requested. In the case they were, we just throw out any duplicates but still approve the request.
        // (Unless there are no seasons, in which case we abort)
        if (media.requests) {
          existingSeasons = media.requests.reduce((seasons, request) => {
            const combinedSeasons = request.seasons.map(
              (season) => season.seasonNumber
            );

            return [...seasons, ...combinedSeasons];
          }, [] as number[]);
        }

        const finalSeasons = requestedSeasons.filter(
          (rs) => !existingSeasons.includes(rs)
        );

        if (finalSeasons.length === 0) {
          return next({
            status: 202,
            message: 'No seasons available to request',
          });
        }

        const request = new MediaRequest({
          type: MediaType.TV,
          media: {
            id: media.id,
          } as Media,
          requestedBy: req.user,
          // If the user is an admin or has the "auto approve" permission, automatically approve the request
          status:
            req.user?.hasPermission(Permission.AUTO_APPROVE) ||
            req.user?.hasPermission(Permission.AUTO_APPROVE_TV)
              ? MediaRequestStatus.APPROVED
              : MediaRequestStatus.PENDING,
          modifiedBy:
            req.user?.hasPermission(Permission.AUTO_APPROVE) ||
            req.user?.hasPermission(Permission.AUTO_APPROVE_TV)
              ? req.user
              : undefined,
          seasons: finalSeasons.map(
            (sn) =>
              new SeasonRequest({
                seasonNumber: sn,
                status:
                  req.user?.hasPermission(Permission.AUTO_APPROVE) ||
                  req.user?.hasPermission(Permission.AUTO_APPROVE_TV)
                    ? MediaRequestStatus.APPROVED
                    : MediaRequestStatus.PENDING,
              })
          ),
        });

        await requestRepository.save(request);
        return res.status(201).json(request);
      }

      next({ status: 500, message: 'Invalid media type' });
    } catch (e) {
      next({ message: e.message, status: 500 });
    }
  }
);

requestRoutes.get('/:requestId', async (req, res, next) => {
  const requestRepository = getRepository(MediaRequest);

  try {
    const request = await requestRepository.findOneOrFail({
      where: { id: Number(req.params.requestId) },
      relations: ['requestedBy', 'modifiedBy'],
    });

    return res.status(200).json(request);
  } catch (e) {
    next({ status: 404, message: 'Request not found' });
  }
});

requestRoutes.delete('/:requestId', async (req, res, next) => {
  const requestRepository = getRepository(MediaRequest);

  try {
    const request = await requestRepository.findOneOrFail({
      where: { id: Number(req.params.requestId) },
      relations: ['requestedBy', 'modifiedBy'],
    });

    if (
      !req.user?.hasPermission(Permission.MANAGE_REQUESTS) &&
      request.requestedBy.id !== req.user?.id &&
      request.status !== 1
    ) {
      return next({
        status: 401,
        message: 'You do not have permission to remove this request',
      });
    }

    await requestRepository.remove(request);

    return res.status(204).send();
  } catch (e) {
    logger.error(e.message);
    next({ status: 404, message: 'Request not found' });
  }
});

requestRoutes.post<{
  requestId: string;
}>(
  '/:requestId/retry',
  isAuthenticated(Permission.MANAGE_REQUESTS),
  async (req, res, next) => {
    const requestRepository = getRepository(MediaRequest);

    try {
      const request = await requestRepository.findOneOrFail({
        where: { id: Number(req.params.requestId) },
        relations: ['requestedBy', 'modifiedBy'],
      });

      await request.updateParentStatus();
      await request.sendMedia();
      return res.status(200).json(request);
    } catch (e) {
      logger.error('Error processing request retry', {
        label: 'Media Request',
        message: e.message,
      });
      next({ status: 404, message: 'Request not found' });
    }
  }
);
requestRoutes.get<{
  requestId: string;
  status: 'pending' | 'approve' | 'decline';
}>(
  '/:requestId/:status',
  isAuthenticated(Permission.MANAGE_REQUESTS),
  async (req, res, next) => {
    const requestRepository = getRepository(MediaRequest);

    try {
      const request = await requestRepository.findOneOrFail({
        where: { id: Number(req.params.requestId) },
        relations: ['requestedBy', 'modifiedBy'],
      });

      let newStatus: MediaRequestStatus;

      switch (req.params.status) {
        case 'pending':
          newStatus = MediaRequestStatus.PENDING;
          break;
        case 'approve':
          newStatus = MediaRequestStatus.APPROVED;
          break;
        case 'decline':
          newStatus = MediaRequestStatus.DECLINED;
          break;
      }

      request.status = newStatus;
      request.modifiedBy = req.user;
      await requestRepository.save(request);

      return res.status(200).json(request);
    } catch (e) {
      logger.error('Error processing request update', {
        label: 'Media Request',
        message: e.message,
      });
      next({ status: 404, message: 'Request not found' });
    }
  }
);

export default requestRoutes;
