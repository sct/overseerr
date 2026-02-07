import {
  MediaRequestStatus,
  MediaStatus,
  MediaType,
} from '@server/constants/media';
import { getRepository } from '@server/datasource';
import Media from '@server/entity/Media';
import {
  DuplicateMediaRequestError,
  MediaRequest,
  NoSeasonsAvailableError,
  QuotaRestrictedError,
  RequestPermissionError,
} from '@server/entity/MediaRequest';
import SeasonRequest from '@server/entity/SeasonRequest';
import { User } from '@server/entity/User';
import type {
  MediaRequestBody,
  RequestResultsResponse,
} from '@server/interfaces/api/requestInterfaces';
import { createAuditLog } from '@server/lib/auditLog';
import { Permission } from '@server/lib/permissions';
import logger from '@server/logger';
import { isAuthenticated } from '@server/middleware/auth';
import { Router } from 'express';
import { In } from 'typeorm';

const requestRoutes = Router();

interface BulkRequestBody {
  requestIds: number[];
  action: 'approve' | 'decline' | 'delete';
}

interface BulkRequestResponse {
  updated: number;
  deleted: number;
}

requestRoutes.get<Record<string, unknown>, RequestResultsResponse>(
  '/',
  async (req, res, next) => {
    try {
      const pageSize = req.query.take ? Number(req.query.take) : 10;
      const skip = req.query.skip ? Number(req.query.skip) : 0;
      const requestedBy = req.query.requestedBy
        ? Number(req.query.requestedBy)
        : null;

      let statusFilter: MediaRequestStatus[];

      switch (req.query.filter) {
        case 'approved':
        case 'processing':
          statusFilter = [MediaRequestStatus.APPROVED];
          break;
        case 'pending':
          statusFilter = [MediaRequestStatus.PENDING];
          break;
        case 'unavailable':
          statusFilter = [
            MediaRequestStatus.PENDING,
            MediaRequestStatus.APPROVED,
          ];
          break;
        case 'failed':
          statusFilter = [MediaRequestStatus.FAILED];
          break;
        case 'completed':
        case 'available':
        case 'deleted':
          statusFilter = [MediaRequestStatus.COMPLETED];
          break;
        default:
          statusFilter = [
            MediaRequestStatus.PENDING,
            MediaRequestStatus.APPROVED,
            MediaRequestStatus.DECLINED,
            MediaRequestStatus.FAILED,
            MediaRequestStatus.COMPLETED,
          ];
      }

      let mediaStatusFilter: MediaStatus[];

      switch (req.query.filter) {
        case 'available':
          mediaStatusFilter = [MediaStatus.AVAILABLE];
          break;
        case 'processing':
        case 'unavailable':
          mediaStatusFilter = [
            MediaStatus.UNKNOWN,
            MediaStatus.PENDING,
            MediaStatus.PROCESSING,
            MediaStatus.PARTIALLY_AVAILABLE,
          ];
          break;
        case 'deleted':
          mediaStatusFilter = [MediaStatus.DELETED];
          break;
        default:
          mediaStatusFilter = [
            MediaStatus.UNKNOWN,
            MediaStatus.PENDING,
            MediaStatus.PROCESSING,
            MediaStatus.PARTIALLY_AVAILABLE,
            MediaStatus.AVAILABLE,
            MediaStatus.DELETED,
          ];
      }

      let sortFilter: string;

      switch (req.query.sort) {
        case 'modified':
          sortFilter = 'request.updatedAt';
          break;
        default:
          sortFilter = 'request.id';
      }

      let query = getRepository(MediaRequest)
        .createQueryBuilder('request')
        .leftJoinAndSelect('request.media', 'media')
        .leftJoinAndSelect('request.seasons', 'seasons')
        .leftJoinAndSelect('request.modifiedBy', 'modifiedBy')
        .leftJoinAndSelect('request.requestedBy', 'requestedBy')
        .where('request.status IN (:...requestStatus)', {
          requestStatus: statusFilter,
        })
        .andWhere(
          '((request.is4k = 0 AND media.status IN (:...mediaStatus)) OR (request.is4k = 1 AND media.status4k IN (:...mediaStatus)))',
          {
            mediaStatus: mediaStatusFilter,
          }
        );

      if (
        !req.user?.hasPermission(
          [Permission.MANAGE_REQUESTS, Permission.REQUEST_VIEW],
          { type: 'or' }
        )
      ) {
        if (requestedBy && requestedBy !== req.user?.id) {
          return next({
            status: 403,
            message: "You do not have permission to view this user's requests.",
          });
        }

        query = query.andWhere('requestedBy.id = :id', {
          id: req.user?.id,
        });
      } else if (requestedBy) {
        query = query.andWhere('requestedBy.id = :id', {
          id: requestedBy,
        });
      }

      // Filter by media type (movie, tv, music)
      const typeFilter = req.query.type as string | undefined;
      if (typeFilter === 'movie') {
        query = query.andWhere('request.type = :movieType', {
          movieType: MediaType.MOVIE,
        });
      } else if (typeFilter === 'tv') {
        query = query.andWhere('request.type = :tvType', {
          tvType: MediaType.TV,
        });
      } else if (typeFilter === 'music') {
        query = query.andWhere('request.type IN (:...musicTypes)', {
          musicTypes: [MediaType.ARTIST, MediaType.ALBUM, MediaType.MUSIC],
        });
      }

      const [requests, requestCount] = await query
        .orderBy(sortFilter, 'DESC')
        .take(pageSize)
        .skip(skip)
        .getManyAndCount();

      return res.status(200).json({
        pageInfo: {
          pages: Math.ceil(requestCount / pageSize),
          pageSize,
          results: requestCount,
          page: Math.ceil(skip / pageSize) + 1,
        },
        results: requests,
      });
    } catch (e) {
      logger.error('Error retrieving requests', {
        label: 'API',
        errorMessage: e.message,
      });
      next({ status: 500, message: 'Unable to retrieve requests.' });
    }
  }
);

requestRoutes.post<never, MediaRequest, MediaRequestBody>(
  '/',
  async (req, res, next) => {
    try {
      if (!req.user) {
        return next({
          status: 401,
          message: 'You must be logged in to request media.',
        });
      }
      const request = await MediaRequest.request(req.body, req.user);

      return res.status(201).json(request);
    } catch (error) {
      if (!(error instanceof Error)) {
        return;
      }

      switch (error.constructor) {
        case RequestPermissionError:
        case QuotaRestrictedError:
          return next({ status: 403, message: error.message });
        case DuplicateMediaRequestError:
          return next({ status: 409, message: error.message });
        case NoSeasonsAvailableError:
          return next({ status: 202, message: error.message });
        default:
          return next({ status: 500, message: error.message });
      }
    }
  }
);

requestRoutes.get('/count', async (_req, res, next) => {
  const requestRepository = getRepository(MediaRequest);

  try {
    const counts = await requestRepository
      .createQueryBuilder('request')
      .innerJoin('request.media', 'media')
      .select('COUNT(*)', 'total')
      .addSelect(
        `SUM(CASE WHEN request.type = :movieType THEN 1 ELSE 0 END)`,
        'movie'
      )
      .addSelect(
        `SUM(CASE WHEN request.type = :tvType THEN 1 ELSE 0 END)`,
        'tv'
      )
      .addSelect(
        `SUM(CASE WHEN request.status = :pendingStatus THEN 1 ELSE 0 END)`,
        'pending'
      )
      .addSelect(
        `SUM(CASE WHEN request.status = :approvedStatus THEN 1 ELSE 0 END)`,
        'approved'
      )
      .addSelect(
        `SUM(CASE WHEN request.status = :declinedStatus THEN 1 ELSE 0 END)`,
        'declined'
      )
      .addSelect(
        `SUM(CASE WHEN request.status = :approvedStatus AND ((request.is4k = 0 AND media.status != :availableStatus) OR (request.is4k = 1 AND media.status4k != :availableStatus)) THEN 1 ELSE 0 END)`,
        'processing'
      )
      .addSelect(
        `SUM(CASE WHEN request.status = :approvedStatus AND ((request.is4k = 0 AND media.status = :availableStatus) OR (request.is4k = 1 AND media.status4k = :availableStatus)) THEN 1 ELSE 0 END)`,
        'available'
      )
      .setParameters({
        movieType: MediaType.MOVIE,
        tvType: MediaType.TV,
        pendingStatus: MediaRequestStatus.PENDING,
        approvedStatus: MediaRequestStatus.APPROVED,
        declinedStatus: MediaRequestStatus.DECLINED,
        availableStatus: MediaStatus.AVAILABLE,
      })
      .getRawOne();

    return res.status(200).json({
      total: Number(counts.total) || 0,
      movie: Number(counts.movie) || 0,
      tv: Number(counts.tv) || 0,
      pending: Number(counts.pending) || 0,
      approved: Number(counts.approved) || 0,
      declined: Number(counts.declined) || 0,
      processing: Number(counts.processing) || 0,
      available: Number(counts.available) || 0,
    });
  } catch (e) {
    logger.error('Something went wrong retrieving request counts', {
      label: 'API',
      errorMessage: e.message,
    });
    next({ status: 500, message: 'Unable to retrieve request counts.' });
  }
});

requestRoutes.get(
  '/export',
  isAuthenticated(Permission.MANAGE_REQUESTS),
  async (req, res, next) => {
    try {
      const requestedBy = req.query.requestedBy
        ? Number(req.query.requestedBy)
        : null;

      let statusFilter: MediaRequestStatus[];
      switch (req.query.filter) {
        case 'approved':
        case 'processing':
          statusFilter = [MediaRequestStatus.APPROVED];
          break;
        case 'pending':
          statusFilter = [MediaRequestStatus.PENDING];
          break;
        case 'unavailable':
          statusFilter = [
            MediaRequestStatus.PENDING,
            MediaRequestStatus.APPROVED,
          ];
          break;
        case 'failed':
          statusFilter = [MediaRequestStatus.FAILED];
          break;
        case 'completed':
        case 'available':
        case 'deleted':
          statusFilter = [MediaRequestStatus.COMPLETED];
          break;
        default:
          statusFilter = [
            MediaRequestStatus.PENDING,
            MediaRequestStatus.APPROVED,
            MediaRequestStatus.DECLINED,
            MediaRequestStatus.FAILED,
            MediaRequestStatus.COMPLETED,
          ];
      }

      let mediaStatusFilter: MediaStatus[];
      switch (req.query.filter) {
        case 'available':
          mediaStatusFilter = [MediaStatus.AVAILABLE];
          break;
        case 'processing':
        case 'unavailable':
          mediaStatusFilter = [
            MediaStatus.UNKNOWN,
            MediaStatus.PENDING,
            MediaStatus.PROCESSING,
            MediaStatus.PARTIALLY_AVAILABLE,
          ];
          break;
        case 'deleted':
          mediaStatusFilter = [MediaStatus.DELETED];
          break;
        default:
          mediaStatusFilter = [
            MediaStatus.UNKNOWN,
            MediaStatus.PENDING,
            MediaStatus.PROCESSING,
            MediaStatus.PARTIALLY_AVAILABLE,
            MediaStatus.AVAILABLE,
            MediaStatus.DELETED,
          ];
      }

      let sortFilter: string;
      switch (req.query.sort) {
        case 'modified':
          sortFilter = 'request.updatedAt';
          break;
        default:
          sortFilter = 'request.id';
      }

      let query = getRepository(MediaRequest)
        .createQueryBuilder('request')
        .leftJoinAndSelect('request.media', 'media')
        .leftJoinAndSelect('request.seasons', 'seasons')
        .leftJoinAndSelect('request.modifiedBy', 'modifiedBy')
        .leftJoinAndSelect('request.requestedBy', 'requestedBy')
        .where('request.status IN (:...requestStatus)', {
          requestStatus: statusFilter,
        })
        .andWhere(
          '((request.is4k = 0 AND media.status IN (:...mediaStatus)) OR (request.is4k = 1 AND media.status4k IN (:...mediaStatus)))',
          {
            mediaStatus: mediaStatusFilter,
          }
        )
        .orderBy(sortFilter, 'DESC');

      if (requestedBy) {
        query = query.andWhere('requestedBy.id = :id', { id: requestedBy });
      }

      // Filter by media type (movie, tv, music)
      const typeFilter = req.query.type as string | undefined;
      if (typeFilter === 'movie') {
        query = query.andWhere('request.type = :movieType', {
          movieType: MediaType.MOVIE,
        });
      } else if (typeFilter === 'tv') {
        query = query.andWhere('request.type = :tvType', {
          tvType: MediaType.TV,
        });
      } else if (typeFilter === 'music') {
        query = query.andWhere('request.type IN (:...musicTypes)', {
          musicTypes: [MediaType.ARTIST, MediaType.ALBUM, MediaType.MUSIC],
        });
      }

      const requests = await query.getMany();

      const csvEscape = (value: unknown): string => {
        const str = value === null || value === undefined ? '' : String(value);
        if (/[",\n]/.test(str)) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const header = [
        'id',
        'type',
        'requestedBy',
        'modifiedBy',
        'requestStatus',
        'is4k',
        'tmdbId',
        'musicBrainzId',
        'mediaStatus',
        'createdAt',
        'updatedAt',
      ];

      const rows = requests.map((r) => {
        const mediaStatus = r.is4k ? r.media.status4k : r.media.status;
        const isMusic =
          r.type === MediaType.ARTIST ||
          r.type === MediaType.ALBUM ||
          r.type === MediaType.MUSIC;
        return [
          r.id,
          r.type,
          r.requestedBy?.displayName ?? '',
          r.modifiedBy?.displayName ?? '',
          // TS enums have reverse mappings
          (MediaRequestStatus as Record<number, string>)[r.status] ?? r.status,
          r.is4k,
          isMusic ? '' : r.media.tmdbId ?? '',
          isMusic ? r.media.musicBrainzId ?? '' : '',
          (MediaStatus as Record<number, string>)[mediaStatus] ?? mediaStatus,
          r.createdAt ? new Date(r.createdAt).toISOString() : '',
          r.updatedAt ? new Date(r.updatedAt).toISOString() : '',
        ].map(csvEscape);
      });

      const csv = [header.map(csvEscape), ...rows]
        .map((r) => r.join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="requests-export-${Date.now()}.csv"`
      );

      return res.status(200).send(csv);
    } catch (e) {
      logger.error('Error exporting requests', {
        label: 'Media Request',
        message: e.message,
      });
      return next({ status: 500, message: 'Unable to export requests.' });
    }
  }
);

requestRoutes.post<never, BulkRequestResponse, BulkRequestBody>(
  '/bulk',
  isAuthenticated(Permission.MANAGE_REQUESTS),
  async (req, res, next) => {
    const requestRepository = getRepository(MediaRequest);

    try {
      const requestIds = (req.body.requestIds ?? []).filter(
        (id): id is number => typeof id === 'number' && Number.isFinite(id)
      );

      if (!requestIds.length) {
        return next({ status: 400, message: 'No request IDs provided.' });
      }

      const requests = await requestRepository.find({
        where: { id: In(requestIds) },
        relations: {
          requestedBy: true,
          modifiedBy: true,
          seasons: true,
          media: true,
        },
      });

      if (!requests.length) {
        return next({ status: 404, message: 'No matching requests found.' });
      }

      let updated = 0;
      let deleted = 0;

      if (req.body.action === 'delete') {
        await requestRepository.remove(requests);
        deleted = requests.length;
      } else {
        const newStatus =
          req.body.action === 'approve'
            ? MediaRequestStatus.APPROVED
            : MediaRequestStatus.DECLINED;

        for (const request of requests) {
          request.status = newStatus;
          request.modifiedBy = req.user;
        }
        await requestRepository.save(requests);
        updated = requests.length;
      }

      await createAuditLog({
        user: req.user,
        ip: req.ip,
        action: `request.bulk.${req.body.action}`,
        entityType: 'MediaRequest',
        meta: {
          requestIds,
          updated,
          deleted,
        },
      });

      return res.status(200).json({ updated, deleted });
    } catch (e) {
      logger.error('Error processing bulk request action', {
        label: 'Media Request',
        message: e.message,
      });
      return next({
        status: 500,
        message: 'Unable to process bulk request action.',
      });
    }
  }
);

requestRoutes.get('/:requestId', async (req, res, next) => {
  const requestRepository = getRepository(MediaRequest);

  try {
    const request = await requestRepository.findOneOrFail({
      where: { id: Number(req.params.requestId) },
      relations: { requestedBy: true, modifiedBy: true },
    });

    if (
      request.requestedBy.id !== req.user?.id &&
      !req.user?.hasPermission(
        [Permission.MANAGE_REQUESTS, Permission.REQUEST_VIEW],
        { type: 'or' }
      )
    ) {
      return next({
        status: 403,
        message: 'You do not have permission to view this request.',
      });
    }

    return res.status(200).json(request);
  } catch (e) {
    logger.debug('Failed to retrieve request.', {
      label: 'API',
      errorMessage: e.message,
    });
    next({ status: 404, message: 'Request not found.' });
  }
});

requestRoutes.put<{ requestId: string }>(
  '/:requestId',
  async (req, res, next) => {
    const requestRepository = getRepository(MediaRequest);
    const userRepository = getRepository(User);
    try {
      const request = await requestRepository.findOne({
        where: {
          id: Number(req.params.requestId),
        },
      });

      if (!request) {
        return next({ status: 404, message: 'Request not found.' });
      }

      if (
        (request.requestedBy.id !== req.user?.id ||
          (req.body.mediaType !== 'tv' &&
            req.body.mediaType !== 'artist' &&
            req.body.mediaType !== 'album' &&
            !req.user?.hasPermission(Permission.REQUEST_ADVANCED))) &&
        !req.user?.hasPermission(Permission.MANAGE_REQUESTS)
      ) {
        return next({
          status: 403,
          message: 'You do not have permission to modify this request.',
        });
      }

      let requestUser = request.requestedBy;

      if (
        req.body.userId &&
        req.body.userId !== request.requestedBy.id &&
        !req.user?.hasPermission([
          Permission.MANAGE_USERS,
          Permission.MANAGE_REQUESTS,
        ])
      ) {
        return next({
          status: 403,
          message: 'You do not have permission to modify the request user.',
        });
      } else if (req.body.userId) {
        requestUser = await userRepository.findOneOrFail({
          where: { id: req.body.userId },
        });
      }

      if (req.body.mediaType === MediaType.MOVIE) {
        request.serverId = req.body.serverId;
        request.profileId = req.body.profileId;
        request.rootFolder = req.body.rootFolder;
        request.tags = req.body.tags;
        request.requestedBy = requestUser as User;

        await requestRepository.save(request);
      } else if (req.body.mediaType === MediaType.TV) {
        const mediaRepository = getRepository(Media);
        request.serverId = req.body.serverId;
        request.profileId = req.body.profileId;
        request.rootFolder = req.body.rootFolder;
        request.languageProfileId = req.body.languageProfileId;
        request.tags = req.body.tags;
        request.requestedBy = requestUser as User;

        const requestedSeasons = req.body.seasons as number[] | undefined;

        if (!requestedSeasons || requestedSeasons.length === 0) {
          throw new Error(
            'Missing seasons. If you want to cancel a series request, use the DELETE method.'
          );
        }

        // Get existing media so we can work with all the requests
        const media = await mediaRepository.findOneOrFail({
          where: { tmdbId: request.media.tmdbId, mediaType: MediaType.TV },
          relations: { requests: true },
        });

        // Get all requested seasons that are not part of this request we are editing
        const existingSeasons = media.requests
          .filter(
            (r) =>
              r.is4k === request.is4k &&
              r.id !== request.id &&
              r.status !== MediaRequestStatus.DECLINED &&
              r.status !== MediaRequestStatus.COMPLETED
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
      } else if (
        req.body.mediaType === MediaType.ARTIST ||
        req.body.mediaType === MediaType.ALBUM
      ) {
        // Music requests (artist/album)
        request.serverId = req.body.serverId;
        request.profileId = req.body.profileId;
        request.rootFolder = req.body.rootFolder;
        request.metadataProfileId = req.body.metadataProfileId;
        request.tags = req.body.tags;
        request.requestedBy = requestUser as User;

        await requestRepository.save(request);
      }

      return res.status(200).json(request);
    } catch (e) {
      logger.error('Error updating request', {
        label: 'API',
        errorMessage: e.message,
      });
      next({ status: 500, message: 'Unable to update request.' });
    }
  }
);

requestRoutes.delete('/:requestId', async (req, res, next) => {
  const requestRepository = getRepository(MediaRequest);

  try {
    const request = await requestRepository.findOneOrFail({
      where: { id: Number(req.params.requestId) },
      relations: { requestedBy: true, modifiedBy: true },
    });

    if (
      !req.user?.hasPermission(Permission.MANAGE_REQUESTS) &&
      request.requestedBy.id !== req.user?.id &&
      request.status !== 1
    ) {
      return next({
        status: 401,
        message: 'You do not have permission to delete this request.',
      });
    }

    await requestRepository.remove(request);

    await createAuditLog({
      user: req.user,
      ip: req.ip,
      action: 'request.delete',
      entityType: 'MediaRequest',
      entityId: request.id,
      meta: {
        requestId: request.id,
      },
    });

    return res.status(204).send();
  } catch (e) {
    logger.error('Something went wrong deleting a request.', {
      label: 'API',
      errorMessage: e.message,
    });
    next({ status: 404, message: 'Request not found.' });
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
        relations: { requestedBy: true, modifiedBy: true },
      });

      // this also triggers updating the parent media's status & sending to *arr
      request.status = MediaRequestStatus.APPROVED;
      await requestRepository.save(request);

      return res.status(200).json(request);
    } catch (e) {
      logger.error('Error processing request retry', {
        label: 'Media Request',
        message: e.message,
      });
      next({ status: 404, message: 'Request not found.' });
    }
  }
);

requestRoutes.post<{
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
        relations: { requestedBy: true, modifiedBy: true },
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

      await createAuditLog({
        user: req.user,
        ip: req.ip,
        action: 'request.status.update',
        entityType: 'MediaRequest',
        entityId: request.id,
        meta: {
          requestId: request.id,
          status: req.params.status,
        },
      });

      return res.status(200).json(request);
    } catch (e) {
      logger.error('Error processing request update', {
        label: 'Media Request',
        message: e.message,
      });
      next({ status: 404, message: 'Request not found.' });
    }
  }
);

export default requestRoutes;
