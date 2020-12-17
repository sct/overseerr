import { Router } from 'express';
import { getRepository } from 'typeorm';
import { MediaRequest } from '../entity/MediaRequest';
import { User } from '../entity/User';
import { hasPermission, Permission } from '../lib/permissions';
import logger from '../logger';

const router = Router();

router.get('/', async (_req, res) => {
  const userRepository = getRepository(User);

  const users = await userRepository.find();

  return res.status(200).json(User.filterMany(users));
});

router.post('/', async (req, res, next) => {
  try {
    const userRepository = getRepository(User);

    const user = new User({
      email: req.body.email,
      permissions: req.body.permissions,
      plexToken: '',
    });
    await userRepository.save(user);
    return res.status(201).json(user.filter());
  } catch (e) {
    next({ status: 500, message: e.message });
  }
});

router.get<{ id: string }>('/:id', async (req, res, next) => {
  try {
    const userRepository = getRepository(User);

    const user = await userRepository.findOneOrFail({
      where: { id: Number(req.params.id) },
    });

    return res.status(200).json(user.filter());
  } catch (e) {
    next({ status: 404, message: 'User not found' });
  }
});

router.put<{ id: string }>('/:id', async (req, res, next) => {
  try {
    const userRepository = getRepository(User);

    const user = await userRepository.findOneOrFail({
      where: { id: Number(req.params.id) },
    });

    // Only let the owner user modify themselves
    if (user.id === 1 && req.user?.id !== 1) {
      return next({
        status: 403,
        message: 'You do not have permission to modify this user',
      });
    }

    // Only let the owner grant admin privileges
    if (
      hasPermission(Permission.ADMIN, req.body.permissions) &&
      req.user?.id !== 1
    ) {
      return next({
        status: 403,
        message: 'You do not have permission to grant this level of access',
      });
    }

    // Only let users with the manage settings permission, grant the same permission
    if (
      hasPermission(Permission.MANAGE_SETTINGS, req.body.permissions) &&
      !hasPermission(Permission.MANAGE_SETTINGS, req.user?.permissions ?? 0)
    ) {
      return next({
        status: 403,
        message: 'You do not have permission to grant this level of access',
      });
    }

    Object.assign(user, req.body);
    await userRepository.save(user);

    return res.status(200).json(user.filter());
  } catch (e) {
    next({ status: 404, message: 'User not found' });
  }
});

router.delete<{ id: string }>('/:id', async (req, res, next) => {
  try {
    const userRepository = getRepository(User);

    const user = await userRepository.findOne({
      where: { id: Number(req.params.id) },
      relations: ['requests'],
    });

    if (!user) {
      return next({ status: 404, message: 'User not found' });
    }

    if (user.id === 1) {
      return next({ status: 405, message: 'This account cannot be deleted.' });
    }

    if (user.hasPermission(Permission.ADMIN)) {
      return next({
        status: 405,
        message: 'You cannot delete users with administrative privileges.',
      });
    }

    const requestRepository = getRepository(MediaRequest);

    /**
     * Requests are usually deleted through a cascade constraint. Those however, do
     * not trigger the removal event so listeners to not run and the parent Media
     * will not be updated back to unknown for titles that were still pending. So
     * we manually remove all requests from the user here so the parent media's
     * properly reflect the change.
     */
    await requestRepository.remove(user.requests);

    await userRepository.delete(user.id);
    return res.status(200).json(user.filter());
  } catch (e) {
    logger.error('Something went wrong deleting a user', {
      label: 'API',
      userId: req.params.id,
      errorMessage: e.message,
    });
    return next({
      status: 500,
      message: 'Something went wrong deleting the user',
    });
  }
});

export default router;
