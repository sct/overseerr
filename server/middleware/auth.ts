import { getRepository } from '@server/datasource';
import { ApiKey } from '@server/entity/ApiKey';
import { User } from '@server/entity/User';
import type {
  Permission,
  PermissionCheckOptions,
} from '@server/lib/permissions';
import { getSettings } from '@server/lib/settings';
import { createHash } from 'crypto';

export const checkUser: Middleware = async (req, _res, next) => {
  const settings = getSettings();
  let user: User | undefined | null;

  const apiKeyHeader = req.header('X-API-Key');

  // Legacy single API key behavior (kept for backward compatibility)
  if (apiKeyHeader && apiKeyHeader === settings.main.apiKey) {
    const userRepository = getRepository(User);

    let userId = 1; // Work on original administrator account

    // If a User ID is provided, we will act on that user's behalf
    if (req.header('X-API-User')) {
      userId = Number(req.header('X-API-User'));
    }

    user = await userRepository.findOne({ where: { id: userId } });
  } else if (apiKeyHeader) {
    // New multi-key support (scoped permissions)
    const apiKeyRepository = getRepository(ApiKey);
    const hash = createHash('sha256').update(apiKeyHeader).digest('hex');
    const apiKey = await apiKeyRepository.findOne({
      where: { keyHash: hash, isActive: true },
      relations: { user: true },
    });

    if (apiKey?.user) {
      // Restrict permissions to the key's allowed scope
      apiKey.user.permissions = apiKey.user.permissions & apiKey.permissions;
      user = apiKey.user;

      const now = Date.now();
      const lastUsed = apiKey.lastUsedAt ? apiKey.lastUsedAt.getTime() : 0;
      if (!apiKey.lastUsedAt || now - lastUsed > 5 * 60 * 1000) {
        apiKey.lastUsedAt = new Date();
        apiKeyRepository.save(apiKey);
      }
    }
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
