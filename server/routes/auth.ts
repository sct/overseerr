import PlexTvAPI from '@server/api/plextv';
import { UserType } from '@server/constants/user';
import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import { Permission } from '@server/lib/permissions';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { isAuthenticated } from '@server/middleware/auth';
import { Router, Request } from 'express';
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  createJwtSchema,
  getOIDCRedirectUrl,
  getOIDCWellknownConfiguration,
  OIDCJwtPayload,
} from '@server/utils/oidc';
import { randomBytes } from 'crypto';
import gravatarUrl from 'gravatar-url';
import decodeJwt from 'jwt-decode';
import type { InferType } from 'yup';

const authRoutes = Router();

authRoutes.get('/me', isAuthenticated(), async (req, res) => {
  const userRepository = getRepository(User);
  if (!req.user) {
    return res.status(500).json({
      status: 500,
      error: 'Please sign in.',
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
    return next({
      status: 500,
      message: 'Authentication token required.',
    });
  }
  try {
    // First we need to use this auth token to get the user's email from plex.tv
    const plextv = new PlexTvAPI(body.authToken);
    const account = await plextv.getUser();

    // Next let's see if the user already exists
    let user = await userRepository
      .createQueryBuilder('user')
      .where('user.plexId = :id', { id: account.id })
      .orWhere('user.email = :email', {
        email: account.email.toLowerCase(),
      })
      .getOne();

    if (!user && !(await userRepository.count())) {
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
    } else {
      const mainUser = await userRepository.findOneOrFail({
        select: { id: true, plexToken: true, plexId: true, email: true },
        where: { id: 1 },
      });
      const mainPlexTv = new PlexTvAPI(mainUser.plexToken ?? '');

      if (!account.id) {
        logger.error('Plex ID was missing from Plex.tv response', {
          label: 'API',
          ip: req.ip,
          email: account.email,
          plexUsername: account.username,
        });

        return next({
          status: 500,
          message: 'Something went wrong. Try again.',
        });
      }

      if (
        account.id === mainUser.plexId ||
        (account.email === mainUser.email && !mainUser.plexId) ||
        (await mainPlexTv.checkUserAccess(account.id))
      ) {
        if (user) {
          if (!user.plexId) {
            logger.info(
              'Found matching Plex user; updating user with Plex data',
              {
                label: 'API',
                ip: req.ip,
                email: user.email,
                userId: user.id,
                plexId: account.id,
                plexUsername: account.username,
              }
            );
          }

          user.plexToken = body.authToken;
          user.plexId = account.id;
          user.avatar = account.thumb;
          user.email = account.email;
          user.plexUsername = account.username;
          user.userType = UserType.PLEX;

          await userRepository.save(user);
        } else if (!settings.main.newPlexLogin) {
          logger.warn(
            'Failed sign-in attempt by unimported Plex user with access to the media server',
            {
              label: 'API',
              ip: req.ip,
              email: account.email,
              plexId: account.id,
              plexUsername: account.username,
            }
          );
          return next({
            status: 403,
            message: 'Access denied.',
          });
        } else {
          logger.info(
            'Sign-in attempt from Plex user with access to the media server; creating new Overseerr user',
            {
              label: 'API',
              ip: req.ip,
              email: account.email,
              plexId: account.id,
              plexUsername: account.username,
            }
          );
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
        }
      } else {
        logger.warn(
          'Failed sign-in attempt by Plex user without access to the media server',
          {
            label: 'API',
            ip: req.ip,
            email: account.email,
            plexId: account.id,
            plexUsername: account.username,
          }
        );
        return next({
          status: 403,
          message: 'Access denied.',
        });
      }
    }

    // Set logged in session
    if (req.session) {
      req.session.userId = user.id;
    }

    return res.status(200).json(user?.filter() ?? {});
  } catch (e) {
    logger.error('Something went wrong authenticating with Plex account', {
      label: 'API',
      errorMessage: e.message,
      ip: req.ip,
    });
    return next({
      status: 500,
      message: 'Unable to authenticate.',
    });
  }
});

authRoutes.post('/local', async (req, res, next) => {
  const settings = getSettings();
  const userRepository = getRepository(User);
  const body = req.body as { email?: string; password?: string };

  if (!settings.main.localLogin) {
    return res.status(500).json({ error: 'Password sign-in is disabled.' });
  } else if (!body.email || !body.password) {
    return res.status(500).json({
      error: 'You must provide both an email address and a password.',
    });
  }
  try {
    const user = await userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.email', 'user.password', 'user.plexId'])
      .where('user.email = :email', { email: body.email.toLowerCase() })
      .getOne();

    if (!user || !(await user.passwordMatch(body.password))) {
      logger.warn('Failed sign-in attempt using invalid Overseerr password', {
        label: 'API',
        ip: req.ip,
        email: body.email,
        userId: user?.id,
      });
      return next({
        status: 403,
        message: 'Access denied.',
      });
    }

    const mainUser = await userRepository.findOneOrFail({
      select: { id: true, plexToken: true, plexId: true },
      where: { id: 1 },
    });
    const mainPlexTv = new PlexTvAPI(mainUser.plexToken ?? '');

    if (!user.plexId) {
      try {
        const plexUsersResponse = await mainPlexTv.getUsers();
        const account = plexUsersResponse.MediaContainer.User.find(
          (account) =>
            account.$.email &&
            account.$.email.toLowerCase() === user.email.toLowerCase()
        )?.$;

        if (
          account &&
          (await mainPlexTv.checkUserAccess(parseInt(account.id)))
        ) {
          logger.info(
            'Found matching Plex user; updating user with Plex data',
            {
              label: 'API',
              ip: req.ip,
              email: body.email,
              userId: user.id,
              plexId: account.id,
              plexUsername: account.username,
            }
          );

          user.plexId = parseInt(account.id);
          user.avatar = account.thumb;
          user.email = account.email;
          user.plexUsername = account.username;
          user.userType = UserType.PLEX;

          await userRepository.save(user);
        }
      } catch (e) {
        logger.error('Something went wrong fetching Plex users', {
          label: 'API',
          errorMessage: e.message,
        });
      }
    }

    if (
      user.plexId &&
      user.plexId !== mainUser.plexId &&
      !(await mainPlexTv.checkUserAccess(user.plexId))
    ) {
      logger.warn(
        'Failed sign-in attempt from Plex user without access to the media server',
        {
          label: 'API',
          account: {
            ip: req.ip,
            email: body.email,
            userId: user.id,
            plexId: user.plexId,
          },
        }
      );
      return next({
        status: 403,
        message: 'Access denied.',
      });
    }

    // Set logged in session
    if (user && req.session) {
      req.session.userId = user.id;
    }

    return res.status(200).json(user?.filter() ?? {});
  } catch (e) {
    logger.error(
      'Something went wrong authenticating with Overseerr password',
      {
        label: 'API',
        errorMessage: e.message,
        ip: req.ip,
        email: body.email,
      }
    );
    return next({
      status: 500,
      message: 'Unable to authenticate.',
    });
  }
});

authRoutes.post('/logout', (req, res, next) => {
  req.session?.destroy((err) => {
    if (err) {
      return next({
        status: 500,
        message: 'Something went wrong.',
      });
    }

    return res.status(200).json({ status: 'ok' });
  });
});

authRoutes.post('/reset-password', async (req, res, next) => {
  const userRepository = getRepository(User);
  const body = req.body as { email?: string };

  if (!body.email) {
    return next({
      status: 500,
      message: 'Email address required.',
    });
  }

  const user = await userRepository
    .createQueryBuilder('user')
    .where('user.email = :email', { email: body.email.toLowerCase() })
    .getOne();

  if (user) {
    await user.resetPassword();
    userRepository.save(user);
    logger.info('Successfully sent password reset link', {
      label: 'API',
      ip: req.ip,
      email: body.email,
    });
  } else {
    logger.error('Something went wrong sending password reset link', {
      label: 'API',
      ip: req.ip,
      email: body.email,
    });
  }

  return res.status(200).json({ status: 'ok' });
});

authRoutes.post('/reset-password/:guid', async (req, res, next) => {
  const userRepository = getRepository(User);

  if (!req.body.password || req.body.password?.length < 8) {
    logger.warn('Failed password reset attempt using invalid new password', {
      label: 'API',
      ip: req.ip,
      guid: req.params.guid,
    });
    return next({
      status: 500,
      message: 'Password must be at least 8 characters long.',
    });
  }

  const user = await userRepository.findOne({
    where: { resetPasswordGuid: req.params.guid },
  });

  if (!user) {
    logger.warn('Failed password reset attempt using invalid recovery link', {
      label: 'API',
      ip: req.ip,
      guid: req.params.guid,
    });
    return next({
      status: 500,
      message: 'Invalid password reset link.',
    });
  }

  if (
    !user.recoveryLinkExpirationDate ||
    user.recoveryLinkExpirationDate <= new Date()
  ) {
    logger.warn('Failed password reset attempt using expired recovery link', {
      label: 'API',
      ip: req.ip,
      guid: req.params.guid,
      email: user.email,
    });
    return next({
      status: 500,
      message: 'Invalid password reset link.',
    });
  }

  await user.setPassword(req.body.password);
  user.recoveryLinkExpirationDate = null;
  userRepository.save(user);
  logger.info('Successfully reset password', {
    label: 'API',
    ip: req.ip,
    guid: req.params.guid,
    email: user.email,
  });

  return res.status(200).json({ status: 'ok' });
});

authRoutes.get('/oidc-login', async (req, res, next) => {
  const state = randomBytes(32).toString('hex');
  const redirectUrl = await getOIDCRedirectUrl(req, state);

  res.cookie('oidc-state', state, {
    maxAge: 60000,
    httpOnly: true,
    secure: req.protocol === 'https',
  });
  return res.redirect(redirectUrl);
});

authRoutes.get('/oidc-callback', async (req, res, next) => {
  const settings = getSettings();
  const { oidcDomain, oidcClientId, oidcClientSecret } = settings.main;

  // Log the initial OIDC callback request
  logger.info('Received OIDC callback', { ip: req.ip });

  if (!settings.main.oidcLogin) {
    logger.warn('OIDC sign-in is disabled', { ip: req.ip });
    return res.status(500).json({ error: 'OIDC sign-in is disabled.' });
  }

  const cookieState = req.cookies['oidc-state'];
  const url = new URL(req.url, `${req.protocol}://${req.hostname}`);
  const state = url.searchParams.get('state');
  const scope = url.searchParams.get('scope'); // Handling additional 'scope' parameter

  try {
    // State validation
    if (!state || cookieState !== state) {
      logger.warn('OIDC state mismatch', { ip: req.ip, state, cookieState });
      return res.redirect('/login');
    }
    res.clearCookie('oidc-state');

    // Code validation
    const code = url.searchParams.get('code');
    if (!code) {
      logger.warn('OIDC code missing', { ip: req.ip });
      return res.redirect('/login');
    }

    const wellKnownInfo = await getOIDCWellknownConfiguration(oidcDomain);

    // Token request
    const callbackUrl = new URL('/api/v1/auth/oidc-callback', `${req.protocol}://${req.headers.host}`);
    const formData = new URLSearchParams();
    formData.append('client_secret', oidcClientSecret);
    formData.append('grant_type', 'authorization_code');
    formData.append('redirect_uri', callbackUrl.toString());
    formData.append('client_id', oidcClientId);
    formData.append('code', code);
    formData.append('scope', scope); // Include the 'scope' in the token request

    const response = await fetch(wellKnownInfo.token_endpoint, {
      method: 'POST',
      headers: new Headers([
        ['Content-Type', 'application/x-www-form-urlencoded'],
      ]),
      body: formData,
    });

    // Validate response
    const body = await response.json();
    if (body.error) {
      logger.warn('Invalid token response', { ip: req.ip, error: body.error });
      return res.redirect('/login');
    }

    // Token validation
    const { id_token: idToken } = body;
    let decoded;
    try {
      decoded = decodeJwt(idToken);
      const jwtSchema = createJwtSchema({ oidcClientId, oidcDomain });
      await jwtSchema.validate(decoded);
    } catch (error) {
      logger.warn('JWT validation failed', { ip: req.ip, error: error.message });
      return res.redirect('/login');
    }

    // Email verification
    if (!decoded.email_verified) {
      logger.warn('Email not verified', { ip: req.ip, email: decoded.email });
      return res.redirect('/login');
    }

    // User handling
    const userRepository = getRepository(User);
    let user = await userRepository.findOne({ where: { email: decoded.email } });

    // Create user if it doesn't exist
    if (!user) {
      logger.info('Creating new user', { ip: req.ip, email: decoded.email });
      const avatar = gravatarUrl(decoded.email, { default: 'mm', size: 200 });
      user = new User({ avatar, username: decoded.email, email: decoded.email, permissions: settings.main.defaultPermissions, plexToken: '', userType: UserType.LOCAL });
      await userRepository.save(user);
    }

    // Session handling
    if (req.session) {
      req.session.userId = user.id;
    }
    logger.info('User logged in successfully', { ip: req.ip, userId: user.id });
    return res.redirect('/');
  } catch (error) {
    logger.error('OIDC login error', { ip: req.ip, errorMessage: error.message });
    return res.redirect('/login');
  }
});


export default authRoutes;
