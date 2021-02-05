import { Router } from 'express';
import { getRepository, Not } from 'typeorm';
import PlexTvAPI from '../api/plextv';
import { MediaRequest } from '../entity/MediaRequest';
import { User } from '../entity/User';
import { hasPermission, Permission } from '../lib/permissions';
import { getSettings } from '../lib/settings';
import logger from '../logger';
import gravatarUrl from 'gravatar-url';
import { UserType } from '../constants/user';

const router = Router();

router.get('/', async (_req, res) => {
  const userRepository = getRepository(User);

  const users = await userRepository.find();

  return res.status(200).json(User.filterMany(users));
});

router.post('/', async (req, res, next) => {
  try {
    const settings = getSettings();

    const body = req.body;
    const userRepository = getRepository(User);

    const passedExplicitPassword = body.password && body.password.length > 0;
    const avatar = gravatarUrl(body.email, { default: 'mm', size: 200 });

    if (!passedExplicitPassword && !settings.notifications.agents.email) {
      throw new Error('Email notifications must be enabled');
    }

    const user = new User({
      avatar: body.avatar ?? avatar,
      username: body.username ?? body.email,
      email: body.email,
      password: body.password,
      permissions: settings.main.defaultPermissions,
      plexToken: '',
      userType: UserType.LOCAL,
    });

    if (passedExplicitPassword) {
      await user?.setPassword(body.password);
    } else {
      await user?.generatePassword();
    }

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

const canMakePermissionsChange = (permissions: number, user?: User) =>
  // Only let the owner grant admin privileges
  !(hasPermission(Permission.ADMIN, permissions) && user?.id !== 1) ||
  // Only let users with the manage settings permission, grant the same permission
  !(
    hasPermission(Permission.MANAGE_SETTINGS, permissions) &&
    !hasPermission(Permission.MANAGE_SETTINGS, user?.permissions ?? 0)
  );

router.put<
  Record<string, never>,
  Partial<User>[],
  { ids: string[]; permissions: number }
>('/', async (req, res, next) => {
  try {
    const isOwner = req.user?.id === 1;

    if (!canMakePermissionsChange(req.body.permissions, req.user)) {
      return next({
        status: 403,
        message: 'You do not have permission to grant this level of access',
      });
    }

    const userRepository = getRepository(User);

    const users = await userRepository.findByIds(req.body.ids, {
      ...(!isOwner ? { id: Not(1) } : {}),
    });

    const updatedUsers = await Promise.all(
      users.map(async (user) => {
        return userRepository.save(<User>{
          ...user,
          ...{ permissions: req.body.permissions },
        });
      })
    );

    return res.status(200).json(updatedUsers);
  } catch (e) {
    next({ status: 500, message: e.message });
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

    if (!canMakePermissionsChange(req.body.permissions, req.user)) {
      return next({
        status: 403,
        message: 'You do not have permission to grant this level of access',
      });
    }

    Object.assign(user, {
      username: req.body.username,
      permissions: req.body.permissions,
    });

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

router.post('/import-from-plex', async (req, res, next) => {
  try {
    const settings = getSettings();
    const userRepository = getRepository(User);

    // taken from auth.ts
    const mainUser = await userRepository.findOneOrFail({
      select: ['id', 'plexToken'],
      order: { id: 'ASC' },
    });
    const mainPlexTv = new PlexTvAPI(mainUser.plexToken ?? '');

    const plexUsersResponse = await mainPlexTv.getUsers();
    const createdUsers: User[] = [];
    for (const rawUser of plexUsersResponse.MediaContainer.User) {
      const account = rawUser.$;

      const user = await userRepository.findOne({
        where: [{ plexId: account.id }, { email: account.email }],
      });

      if (user) {
        // Update the users avatar with their plex thumbnail (incase it changed)
        user.avatar = account.thumb;
        user.email = account.email;
        user.plexUsername = account.username;

        // in-case the user was previously a local account
        if (user.userType === UserType.LOCAL) {
          user.userType = UserType.PLEX;
          user.plexId = parseInt(account.id);

          if (user.username === account.username) {
            user.username = '';
          }
        }
        await userRepository.save(user);
      } else {
        // Check to make sure it's a real account
        if (account.email && account.username) {
          const newUser = new User({
            plexUsername: account.username,
            email: account.email,
            permissions: settings.main.defaultPermissions,
            plexId: parseInt(account.id),
            plexToken: '',
            avatar: account.thumb,
            userType: UserType.PLEX,
          });
          await userRepository.save(newUser);
          createdUsers.push(newUser);
        }
      }
    }
    return res.status(201).json(User.filterMany(createdUsers));
  } catch (e) {
    next({ status: 500, message: e.message });
  }
});

export default router;
