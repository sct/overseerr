import { Router } from 'express';
import { getRepository } from 'typeorm';
import PlexTvAPI from '../api/plextv';
import { UserType } from '../constants/user';
import { User } from '../entity/User';
import { Permission } from '../lib/permissions';
import { getSettings } from '../lib/settings';
import logger from '../logger';
import { isAuthenticated } from '../middleware/auth';

const authRoutes = Router();

authRoutes.get('/me', isAuthenticated(), async (req, res) => {
  const userRepository = getRepository(User);
  if (!req.user) {
    return res.status(500).json({
      status: 500,
      error:
        'Requested user endpoint without valid authenticated user in session',
    });
  }
  const user = await userRepository.findOneOrFail({
    where: { id: req.user.id },
  });

  return res.status(200).json(user);
});

authRoutes.post('/plex', async (req, res, next) => {
  const settings = getSettings();
  const userRepository = getRepository(User);
  const body = req.body as { authToken?: string };

  if (!body.authToken) {
    return res.status(500).json({ error: 'You must provide an auth token' });
  }
  try {
    // First we need to use this auth token to get the users email from plex.tv
    const plextv = new PlexTvAPI(body.authToken);
    const account = await plextv.getUser();

    // Next let's see if the user already exists
    let user = await userRepository
      .createQueryBuilder('user')
      .where('user.plexId = :id', { id: account.id })
      .orWhere('LOWER(user.email) = :email', {
        email: account.email.toLowerCase(),
      })
      .getOne();

    if (user) {
      // Let's check if their Plex token is up-to-date
      if (user.plexToken !== body.authToken) {
        user.plexToken = body.authToken;
      }

      // Update the user's avatar with their Plex thumbnail, in case it changed
      user.avatar = account.thumb;
      user.email = account.email;
      user.plexUsername = account.username;

      // In case the user was previously a local account
      if (user.userType === UserType.LOCAL) {
        user.userType = UserType.PLEX;
        user.plexId = account.id;
      }

      if (user.username === account.username) {
        user.username = '';
      }
      await userRepository.save(user);
    } else {
      // Here we check if it's the first user. If it is, we create the user with no check
      // and give them admin permissions
      const totalUsers = await userRepository.count();

      if (totalUsers === 0) {
        user = new User({
          email: account.email,
          plexUsername: account.username,
          plexId: account.id,
          plexToken: account.authToken,
          permissions: Permission.ADMIN,
          avatar: account.thumb,
          userType: UserType.PLEX,
        });
        await userRepository.save(user);
      }

      // Double check that we didn't create the first admin user before running this
      if (!user) {
        if (!settings.main.newPlexLogin) {
          logger.info(
            'Failed sign-in attempt from user who has not been imported to Overseerr.',
            {
              label: 'Auth',
              account: {
                ...account,
                authentication_token: '__REDACTED__',
                authToken: '__REDACTED__',
              },
            }
          );
          return next({
            status: 403,
            message: 'Access denied.',
          });
        }

        // If we get to this point, the user does not already exist so we need to create the
        // user _assuming_ they have access to the Plex server
        const mainUser = await userRepository.findOneOrFail({
          select: ['id', 'plexToken'],
          order: { id: 'ASC' },
        });
        const mainPlexTv = new PlexTvAPI(mainUser.plexToken ?? '');

        if (await mainPlexTv.checkUserAccess(account.id)) {
          user = new User({
            email: account.email,
            plexUsername: account.username,
            plexId: account.id,
            plexToken: account.authToken,
            permissions: settings.main.defaultPermissions,
            avatar: account.thumb,
            userType: UserType.PLEX,
          });
          await userRepository.save(user);
        } else {
          logger.info(
            'Failed sign-in attempt from user without access to the Plex server.',
            {
              label: 'Auth',
              account: {
                ...account,
                authentication_token: '__REDACTED__',
                authToken: '__REDACTED__',
              },
            }
          );
          return next({
            status: 403,
            message: 'Access denied.',
          });
        }
      }
    }

    // Set logged in session
    if (req.session) {
      req.session.userId = user.id;
    }

    return res.status(200).json(user?.filter() ?? {});
  } catch (e) {
    logger.error(e.message, { label: 'Auth' });
    return next({
      status: 500,
      message: 'Something went wrong.',
    });
  }
});

authRoutes.post('/local', async (req, res, next) => {
  const settings = getSettings();
  const userRepository = getRepository(User);
  const body = req.body as { email?: string; password?: string };

  if (!settings.main.localLogin) {
    return res.status(500).json({ error: 'Local user sign-in is disabled.' });
  } else if (!body.email || !body.password) {
    return res.status(500).json({
      error: 'You must provide both an email address and a password.',
    });
  }
  try {
    const user = await userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.password'])
      .where('LOWER(user.email) = :email', { email: body.email.toLowerCase() })
      .getOne();

    const isCorrectCredentials = await user?.passwordMatch(body.password);

    // User doesn't exist or credentials are incorrect
    if (!isCorrectCredentials) {
      logger.info(
        'Failed sign-in attempt from user with incorrect credentials.',
        {
          label: 'Auth',
          account: {
            ip: req.ip,
            email: body.email,
            password: '__REDACTED__',
          },
        }
      );
      return next({
        status: 403,
        message: 'Your sign-in credentials are incorrect.',
      });
    }

    // Set logged in session
    if (user && req.session) {
      req.session.userId = user.id;
    }

    return res.status(200).json(user?.filter() ?? {});
  } catch (e) {
    logger.error('Something went wrong while attempting to authenticate.', {
      label: 'Auth',
      error: e.message,
    });
    return next({
      status: 500,
      message: 'Something went wrong.',
    });
  }
});

authRoutes.post('/logout', (req, res, next) => {
  req.session?.destroy((err) => {
    if (err) {
      return next({
        status: 500,
        message: 'Something went wrong while attempting to sign out.',
      });
    }

    return res.status(200).json({ status: 'ok' });
  });
});

authRoutes.post('/reset-password', async (req, res) => {
  const userRepository = getRepository(User);
  const body = req.body as { email?: string };

  if (!body.email) {
    return res
      .status(500)
      .json({ error: 'You must provide an email address.' });
  }

  const user = await userRepository
    .createQueryBuilder('user')
    .where('LOWER(user.email) = :email', { email: body.email.toLowerCase() })
    .getOne();

  if (user) {
    await user.resetPassword();
    userRepository.save(user);
    logger.info('Successful request made for recovery link.', {
      label: 'User Management',
      context: { ip: req.ip, email: body.email },
    });
  } else {
    logger.info('Failed request made to reset a password.', {
      label: 'User Management',
      context: { ip: req.ip, email: body.email },
    });
  }

  return res.status(200).json({ status: 'ok' });
});

authRoutes.post('/reset-password/:guid', async (req, res, next) => {
  const userRepository = getRepository(User);

  try {
    if (!req.body.password || req.body.password?.length < 8) {
      const message =
        'Failed to reset password. Password must be at least 8 characters long.';
      logger.info(message, {
        label: 'User Management',
        context: { ip: req.ip, guid: req.params.guid },
      });
      return next({ status: 500, message: message });
    }

    const user = await userRepository.findOne({
      where: { resetPasswordGuid: req.params.guid },
    });

    if (!user) {
      throw new Error('Guid invalid.');
    }

    if (
      !user.recoveryLinkExpirationDate ||
      user.recoveryLinkExpirationDate <= new Date()
    ) {
      throw new Error('Recovery link expired.');
    }

    await user.setPassword(req.body.password);
    user.recoveryLinkExpirationDate = null;
    userRepository.save(user);
    logger.info(`Successfully reset password`, {
      label: 'User Management',
      context: { ip: req.ip, guid: req.params.guid, email: user.email },
    });

    return res.status(200).json({ status: 'ok' });
  } catch (e) {
    logger.info(`Failed to reset password. ${e.message}`, {
      label: 'User Management',
      context: { ip: req.ip, guid: req.params.guid },
    });
    return res.status(200).json({ status: 'ok' });
  }
});

export default authRoutes;
