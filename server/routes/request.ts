import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth';
import { Permission } from '../lib/permissions';
import { getRepository } from 'typeorm';
import { MediaRequest, MediaRequestStatus } from '../entity/MediaRequest';
import TheMovieDb from '../api/themoviedb';

const requestRoutes = Router();

requestRoutes.get('/', async (req, res, next) => {
  const requestRepository = getRepository(MediaRequest);
  try {
    const requests = req.user?.hasPermission(Permission.MANAGE_REQUESTS)
      ? await requestRepository.find()
      : await requestRepository.find({
          where: { requestedBy: { id: req.user?.id } },
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
    const requestRepository = getRepository(MediaRequest);

    try {
      const media =
        req.body.mediaType === 'movie'
          ? await tmdb.getMovie({ movieId: req.body.mediaId })
          : await tmdb.getTvShow({ tvId: req.body.mediaId });
      const request = new MediaRequest({
        mediaId: media.id,
        mediaType: req.body.mediaType,
        requestedBy: req.user,
        // If the user is an admin or has the "auto approve" permission, automatically approve the request
        status: req.user?.hasPermission(Permission.AUTO_APPROVE)
          ? MediaRequestStatus.APPROVED
          : MediaRequestStatus.PENDING,
      });

      await requestRepository.save(request);

      return res.status(201).json(request);
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

    requestRepository.delete(request.id);

    return res.status(200).json(request);
  } catch (e) {
    next({ status: 404, message: 'Request not found' });
  }
});

requestRoutes.get<{
  requestId: string;
  status: 'pending' | 'approve' | 'decline' | 'available';
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
        case 'available':
          newStatus = MediaRequestStatus.AVAILABLE;
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
