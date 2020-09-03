import { getRepository } from 'typeorm';
import { User } from '../entity/User';
import { Permission } from '../lib/permissions';

export const checkUser: Middleware = async (req, _res, next) => {
  if (req.session?.userId) {
    const userRepository = getRepository(User);

    const user = await userRepository.findOne({
      where: { id: req.session.userId },
    });

    if (user) {
      req.user = user;
    }
  }
  next();
};

export const isAuthenticated = (
  permissions?: Permission | Permission[]
): Middleware => {
  const authMiddleware: Middleware = (req, res, next) => {
    if (!req.user || !req.user.hasPermission(permissions ?? 0)) {
      res.status(403).json({
        status: 403,
        error: 'You do not have permisson to access this endpoint',
      });
    } else {
      next();
    }
  };
  return authMiddleware;
};
