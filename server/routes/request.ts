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
          status: !req.body.is4k ? MediaStatus.PENDING : MediaStatus.UNKNOWN,
          status4k: req.body.is4k ? MediaStatus.PENDING : MediaStatus.UNKNOWN,
          mediaType: req.body.mediaType,
        });
      } else {
        if (media.status === MediaStatus.UNKNOWN && !req.body.is4k) {
          media.status = MediaStatus.PENDING;
        }

        if (media.status4k === MediaStatus.UNKNOWN && req.body.is4k) {
          media.status4k = MediaStatus.PENDING;
        }
      }

      if (req.body.mediaType === 'movie') {
        const existing = await requestRepository.findOne({
          where: {
            media: {
              tmdbId: tmdbMedia.id,
            },
            requestedBy: req.user,
            is4k: req.body.is4k,
          },
        });

        if (existing) {
          logger.warn('Duplicate request for media blocked', {
            tmdbId: tmdbMedia.id,
            mediaType: req.body.mediaType,
          });
          return next({
            status: 409,
            message: 'Request for this media already exists.',
          });
        }

        await mediaRepository.save(media);

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
          is4k: req.body.is4k,
          serverId: req.body.serverId,
          profileId: req.body.profileId,
          rootFolder: req.body.rootFolder,
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
          existingSeasons = media.requests
            .filter(
              (request) =>
                request.is4k === req.body.is4k &&
                request.status !== MediaRequestStatus.DECLINED
            )
            .reduce((seasons, request) => {
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

        await mediaRepository.save(media);

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
          is4k: req.body.is4k,
          serverId: req.body.serverId,
          profileId: req.body.profileId,
          rootFolder: req.body.rootFolder,
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
      next({ status: 500, message: e.message });
    }
  }
);

requestRoutes.get('/count', async (_req, res, next) => {
  const requestRepository = getRepository(MediaRequest);

  try {
    const pendingCount = await requestRepository.count({
      status: MediaRequestStatus.PENDING,
    });
    const approvedCount = await requestRepository.count({
      status: MediaRequestStatus.APPROVED,
    });

    return res.status(200).json({
      pending: pendingCount,
      approved: approvedCount,
    });
  } catch (e) {
    next({ status: 500, message: e.message });
  }
});

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

requestRoutes.put<{ requestId: string }>(
  '/:requestId',
  isAuthenticated(Permission.MANAGE_REQUESTS),
  async (req, res, next) => {
    const requestRepository = getRepository(MediaRequest);
    try {
      const request = await requestRepository.findOne(
        Number(req.params.requestId)
      );

      if (!request) {
        return next({ status: 404, message: 'Request not found' });
      }

      if (req.body.mediaType === 'movie') {
        request.serverId = req.body.serverId;
        request.profileId = req.body.profileId;
        request.rootFolder = req.body.rootFolder;

        requestRepository.save(request);
      } else if (req.body.mediaType === 'tv') {
        const mediaRepository = getRepository(Media);
        request.serverId = req.body.serverId;
        request.profileId = req.body.profileId;
        request.rootFolder = req.body.rootFolder;

        const requestedSeasons = req.body.seasons as number[] | undefined;

        if (!requestedSeasons || requestedSeasons.length === 0) {
          throw new Error(
            'Missing seasons. If you want to cancel a tv request, use the DELETE method.'
          );
        }

        // Get existing media so we can work with all the requests
        const media = await mediaRepository.findOneOrFail({
          where: { tmdbId: request.media.tmdbId, mediaType: MediaType.TV },
          relations: ['requests'],
        });

        // Get all requested seasons that are not part of this request we are editing
        const existingSeasons = media.requests
          .filter(
            (r) =>
              r.is4k === request.is4k &&
              r.id !== request.id &&
              r.status !== MediaRequestStatus.DECLINED
          )
          .reduce((seasons, r) => {
            const combinedSeasons = r.seasons.map(
              (season) => season.seasonNumber
            );

            return [...seasons, ...combinedSeasons];
          }, [] as number[]);

        const filteredSeasons = requestedSeasons.filter(
          (rs) => !existingSeasons.includes(rs)
        );

        if (filteredSeasons.length === 0) {
          return next({
            status: 202,
            message: 'No seasons available to request',
          });
        }

        const newSeasons = requestedSeasons.filter(
          (sn) => !request.seasons.map((s) => s.seasonNumber).includes(sn)
        );

        request.seasons = request.seasons.filter((rs) =>
          filteredSeasons.includes(rs.seasonNumber)
        );

        if (newSeasons.length > 0) {
          logger.debug('Adding new seasons to request', {
            label: 'Media Request',
            newSeasons,
          });
          request.seasons.push(
            ...newSeasons.map(
              (ns) =>
                new SeasonRequest({
                  seasonNumber: ns,
                  status: MediaRequestStatus.PENDING,
                })
            )
          );
        }

        await requestRepository.save(request);
      }

      return res.status(200).json(request);
    } catch (e) {
      next({ status: 500, message: e.message });
    }
  }
);

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
