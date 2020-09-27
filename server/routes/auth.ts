import { Router } from 'express';
import { getRepository } from 'typeorm';
import { User } from '../entity/User';
import PlexTvAPI from '../api/plextv';
import { isAuthenticated } from '../middleware/auth';
import { Permission } from '../lib/permissions';
import logger from '../logger';

const authRoutes = Router();

authRoutes.get('/me', isAuthenticated(), async (req, res) => {
  const userRepository = getRepository(User);
  if (!req.user) {
    return res.status(500).json({
      status: 500,
      error:
        'Requsted user endpoint withuot valid authenticated user in session',
    });
  }
  const user = await userRepository.findOneOrFail({
    where: { id: req.user.id },
  });

  return res.status(200).json(user.filter());
});

authRoutes.post('/login', async (req, res) => {
  const userRepository = getRepository(User);
  const body = req.body as { authToken?: string };

  if (!body.authToken) {
    return res.status(500).json({ error: 'You must provide an auth token' });
  }
  try {
    // First we need to use this auth token to get the users email from plex tv
    const plextv = new PlexTvAPI(body.authToken);
    const account = await plextv.getUser();

    // Next let's see if the user already exists
    let user = await userRepository.findOne({
      where: { plexId: account.id },
    });

    if (user) {
      // Let's check if their plex token is up to date
      if (user.plexToken !== body.authToken) {
        user.plexToken = body.authToken;
        await userRepository.save(user);
      }

      // Update the users avatar with their plex thumbnail (incase it changed)
      user.avatar = account.thumb;
      user.email = account.email;
      user.username = account.username;
    } else {
      // Here we check if it's the first user. If it is, we create the user with no check
      // and give them admin permissions
      const totalUsers = await userRepository.count();

      if (totalUsers === 0) {
        user = new User({
          email: account.email,
          username: account.username,
          plexId: account.id,
          plexToken: account.authToken,
          permissions: Permission.ADMIN,
          avatar: account.thumb,
        });
        await userRepository.save(user);
      }

      // If we get to this point, the user does not already exist so we need to create the
      // user _assuming_ they have access to the plex server
      const mainUser = await userRepository.findOneOrFail({
        select: ['id', 'plexToken'],
        order: { id: 'ASC' },
      });
      const mainPlexTv = new PlexTvAPI(mainUser.plexToken ?? '');
      if (await mainPlexTv.checkUserAccess(account)) {
        user = new User({
          email: account.email,
          username: account.username,
          plexId: account.id,
          plexToken: account.authToken,
          permissions: Permission.REQUEST,
          avatar: account.thumb,
        });
        await userRepository.save(user);
      }
    }

    // Set logged in session
    if (req.session && user) {
      req.session.userId = user.id;
    }

    return res.status(200).json(user?.filter() ?? {});
  } catch (e) {
    logger.error(e.message, { label: 'Auth' });
    res
      .status(500)
      .json({ error: 'Something went wrong. Is your auth token valid?' });
  }
});

authRoutes.get('/logout', (req, res, next) => {
  req.session?.destroy((err) => {
    if (err) {
      return next({
        status: 500,
        message: 'Something went wrong while attempting to logout',
      });
    }

    return res.status(200).json({ status: 'ok' });
  });
});

export default authRoutes;
