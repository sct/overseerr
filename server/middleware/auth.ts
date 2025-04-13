import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import type {
  Permission,
  PermissionCheckOptions,
} from '@server/lib/permissions';
import { getSettings } from '@server/lib/settings';
import type { Session, SessionData } from 'express-session';
import type { Request, Response, NextFunction } from 'express';

interface TrackUserActivityRequest extends Request {
  session: Session & Partial<SessionData> & {
    userId?: number;
  };
}

export const trackUserActivity = async (
  req: TrackUserActivityRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (req.session && req.session.userId) {
    const userRepository = getRepository(User);
    await userRepository.update(
      { id: req.session.userId },
      { lastActive: new Date().toISOString() }
    );
  }
  next();
};

export const validateUserId = (req: Request, res: Response, next: NextFunction) => {
  const userId = Number(req.params.userId);

  if (isNaN(userId)) {
    return res.status(400).json({
      message: 'Invalid userId. It must be a number.',
    });
  }

  req.params.userId = userId.toString(); // Ensure it is passed as a string for consistency
  next();
};

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
  const authMiddleware: Middleware = (req, res, next) => {
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
