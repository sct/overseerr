import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import { getOrCreatePlexUser } from '@server/lib/auth';
import type {
  Permission,
  PermissionCheckOptions,
} from '@server/lib/permissions';
import { getSettings } from '@server/lib/settings';

export const checkUser: Middleware = async (req, _res, next) => {
  const settings = getSettings();
  let user: User | undefined | null;

  if (req.header('X-API-Key') === settings.main.apiKey) {
    const userRepository = getRepository(User);

    let userId = 1; // Work on original administrator account

    // If a User ID is provided, we will act on that user's behalf
    if (req.header('X-API-User')) {
      userId = Number(req.header('X-API-User'));
    }

    user = await userRepository.findOne({ where: { id: userId } });
  } else if (req.session?.userId) {
    const userRepository = getRepository(User);

    user = await userRepository.findOne({
      where: { id: req.session.userId },
    });
  } else if (settings.main.enableForwardAuth) {
    const plexToken = req.header('X-Plex-Token');
    if (plexToken) {
      const maybeUser = await getOrCreatePlexUser(plexToken);
      if (maybeUser instanceof User) {
        user = maybeUser;
      }
    }
  }

  if (user) {
    req.user = user;
  }

  req.locale = user?.settings?.locale
    ? user.settings.locale
    : settings.main.locale;

  next();
};

export const isAuthenticated = (
  permissions?: Permission | Permission[],
  options?: PermissionCheckOptions
): Middleware => {
  const authMiddleware: Middleware = async (req, res, next) => {
    if (!req.user) {
      const settings = getSettings();
      if (settings.main.enableForwardAuth) {
        const authToken = req.header('X-Plex-Token');
        if (authToken) {
          const user = await getOrCreatePlexUser(authToken);
          if (user instanceof User) {
            req.user = user;
          }
        }
      }
    }

    if (!req.user || !req.user.hasPermission(permissions ?? 0, options)) {
      res.status(403).json({
        status: 403,
        error: 'You do not have permission to access this endpoint',
      });
    } else {
      next();
    }
  };
  return authMiddleware;
};
