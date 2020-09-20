import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth';
import { Permission } from '../lib/permissions';
import { getRepository } from 'typeorm';
import { MediaRequest } from '../entity/MediaRequest';
import TheMovieDb from '../api/themoviedb';
import Media from '../entity/Media';
import MovieRequest from '../entity/MovieRequest';
import { MediaStatus, MediaRequestStatus, MediaType } from '../constants/media';
import TvRequest from '../entity/TvRequest';

const requestRoutes = Router();

requestRoutes.get('/', async (req, res, next) => {
  const requestRepository = getRepository(MediaRequest);
  try {
    const requests = req.user?.hasPermission(Permission.MANAGE_REQUESTS)
      ? await requestRepository.find({
          order: {
            id: 'DESC',
          },
          relations: ['media'],
          take: 20,
        })
      : await requestRepository.find({
          where: { requestedBy: { id: req.user?.id } },
          relations: ['media'],
          order: {
            id: 'DESC',
          },
          take: 20,
        });

    return res.status(200).json(requests);
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

    try {
      const tmdbMedia =
        req.body.mediaType === 'movie'
          ? await tmdb.getMovie({ movieId: req.body.mediaId })
          : await tmdb.getTvShow({ tvId: req.body.mediaId });

      let media = await mediaRepository.findOne({
        where: { tmdbId: req.body.mediaId },
      });

      if (!media) {
        media = new Media({
          tmdbId: tmdbMedia.id,
          tvdbId: tmdbMedia.external_ids.tvdb_id,
          status: MediaStatus.PENDING,
          mediaType: req.body.mediaType,
        });
        await mediaRepository.save(media);
      }

      if (req.body.mediaType === 'movie') {
        const requestRepository = getRepository(MovieRequest);

        const request = new MovieRequest({
          media,
          requestedBy: req.user,
          // If the user is an admin or has the "auto approve" permission, automatically approve the request
          status: req.user?.hasPermission(Permission.AUTO_APPROVE)
            ? MediaRequestStatus.APPROVED
            : MediaRequestStatus.PENDING,
        });

        await requestRepository.save(request);
        return res.status(201).json(request);
      } else if (req.body.mediaType === 'tv') {
        const requestRepository = getRepository(TvRequest);

        const request = new TvRequest({
          media,
          requestedBy: req.user,
          // If the user is an admin or has the "auto approve" permission, automatically approve the request
          status: req.user?.hasPermission(Permission.AUTO_APPROVE)
            ? MediaRequestStatus.APPROVED
            : MediaRequestStatus.PENDING,
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
      (request.requestedBy.id !== req.user?.id || request.status > 0)
    ) {
      return next({
        status: 401,
        message: 'You do not have permission to remove this request',
      });
    }

    await requestRepository.delete(request.id);

    return res.status(200).json(request);
  } catch (e) {
    next({ status: 404, message: 'Request not found' });
  }
});

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
      await requestRepository.save(request);

      return res.status(200).json(request);
    } catch (e) {
      next({ status: 404, message: 'Request not found' });
    }
  }
);

export default requestRoutes;
