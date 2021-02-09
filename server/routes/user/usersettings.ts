import { Router } from 'express';
import { getRepository } from 'typeorm';
import { User } from '../../entity/User';
import { Permission } from '../../lib/permissions';

const userSettingsRoutes = Router({ mergeParams: true });

userSettingsRoutes.get<{ id: string }, { username?: string }>(
  '/main',
  async (req, res, next) => {
    const userRepository = getRepository(User);

    if (
      !req.user?.hasPermission(Permission.MANAGE_USERS) &&
      req.user?.id !== Number(req.params.id)
    ) {
      return next({
        status: 403,
        message: 'You do not have permission to view this users settings.',
      });
    }

    try {
      const user = await userRepository.findOne({
        where: { id: Number(req.params.id) },
      });

      if (!user) {
        return next({ status: 404, message: 'User not found' });
      }

      return res.status(200).json({ username: user.username });
    } catch (e) {
      next({ status: 500, message: e.message });
    }
  }
);

userSettingsRoutes.post<
  { id: string },
  { username?: string },
  { username?: string }
>('/main', async (req, res, next) => {
  const userRepository = getRepository(User);

  if (
    !req.user?.hasPermission(Permission.MANAGE_USERS) &&
    req.user?.id !== Number(req.params.id)
  ) {
    return next({
      status: 403,
      message: 'You do not have permission to edit this users settings.',
    });
  }

  try {
    const user = await userRepository.findOne({
      where: { id: Number(req.params.id) },
    });

    if (!user) {
      return next({ status: 404, message: 'User not found' });
    }

    user.username = req.body.username;

    await userRepository.save(user);

    return res.status(200).json({ username: user.username });
  } catch (e) {
    next({ status: 500, message: e.message });
  }
});

export default userSettingsRoutes;
