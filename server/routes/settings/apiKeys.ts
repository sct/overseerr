import { getRepository } from '@server/datasource';
import { ApiKey } from '@server/entity/ApiKey';
import { User } from '@server/entity/User';
import type {
  ApiKeyCreateResponse,
  ApiKeyResponse,
} from '@server/interfaces/api/apiKeyInterfaces';
import { createAuditLog } from '@server/lib/auditLog';
import logger from '@server/logger';
import { Router } from 'express';
import { createHash, randomBytes } from 'crypto';

const apiKeysRoutes = Router();

apiKeysRoutes.get('/', async (_req, res, next) => {
  const repo = getRepository(ApiKey);

  try {
    const keys = await repo.find({
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });

    return res.status(200).json(
      keys.map((k) => ({
        id: k.id,
        name: k.name,
        last4: k.last4,
        permissions: k.permissions,
        isActive: k.isActive,
        createdAt: k.createdAt,
        lastUsedAt: k.lastUsedAt,
        userId: k.user?.id,
      })) as ApiKeyResponse[]
    );
  } catch (e) {
    logger.error('Error retrieving API keys', {
      label: 'API Key',
      errorMessage: e.message,
    });
    return next({ status: 500, message: 'Unable to retrieve API keys.' });
  }
});

apiKeysRoutes.post<never, ApiKeyCreateResponse, { name: string; permissions: number; userId?: number }>(
  '/',
  async (req, res, next) => {
    const repo = getRepository(ApiKey);
    const userRepo = getRepository(User);

    try {
      if (!req.body?.name) {
        return next({ status: 400, message: 'Missing API key name.' });
      }

      const ownerId = req.body.userId ?? 1;
      const owner = await userRepo.findOne({ where: { id: ownerId } });
      if (!owner) {
        return next({ status: 404, message: 'User not found.' });
      }

      const apiKey = randomBytes(32).toString('hex');
      const keyHash = createHash('sha256').update(apiKey).digest('hex');

      const entity = repo.create({
        name: req.body.name,
        keyHash,
        last4: apiKey.slice(-4),
        permissions: req.body.permissions ?? 0,
        isActive: true,
        user: owner,
      });

      const saved = await repo.save(entity);

      await createAuditLog({
        user: req.user,
        ip: req.ip,
        action: 'apiKey.create',
        entityType: 'ApiKey',
        entityId: saved.id,
        meta: { name: saved.name, permissions: saved.permissions, userId: owner.id },
      });

      return res.status(201).json({
        id: saved.id,
        name: saved.name,
        last4: saved.last4,
        permissions: saved.permissions,
        isActive: saved.isActive,
        createdAt: saved.createdAt,
        lastUsedAt: saved.lastUsedAt,
        userId: owner.id,
        apiKey,
      });
    } catch (e) {
      logger.error('Error creating API key', {
        label: 'API Key',
        errorMessage: e.message,
      });
      return next({ status: 500, message: 'Unable to create API key.' });
    }
  }
);

apiKeysRoutes.put<{ keyId: string }, ApiKeyResponse, Partial<Pick<ApiKey, 'name' | 'permissions' | 'isActive'>>>(
  '/:keyId',
  async (req, res, next) => {
    const repo = getRepository(ApiKey);

    try {
      const key = await repo.findOne({
        where: { id: Number(req.params.keyId) },
        relations: { user: true },
      });

      if (!key) {
        return next({ status: 404, message: 'API key not found.' });
      }

      if (typeof req.body.name === 'string') key.name = req.body.name;
      if (typeof req.body.permissions === 'number') key.permissions = req.body.permissions;
      if (typeof req.body.isActive === 'boolean') key.isActive = req.body.isActive;

      const saved = await repo.save(key);

      await createAuditLog({
        user: req.user,
        ip: req.ip,
        action: 'apiKey.update',
        entityType: 'ApiKey',
        entityId: saved.id,
        meta: { name: saved.name, permissions: saved.permissions, isActive: saved.isActive },
      });

      return res.status(200).json({
        id: saved.id,
        name: saved.name,
        last4: saved.last4,
        permissions: saved.permissions,
        isActive: saved.isActive,
        createdAt: saved.createdAt,
        lastUsedAt: saved.lastUsedAt,
        userId: saved.user?.id,
      });
    } catch (e) {
      logger.error('Error updating API key', {
        label: 'API Key',
        errorMessage: e.message,
      });
      return next({ status: 500, message: 'Unable to update API key.' });
    }
  }
);

apiKeysRoutes.delete<{ keyId: string }>('/:keyId', async (req, res, next) => {
  const repo = getRepository(ApiKey);

  try {
    const key = await repo.findOne({ where: { id: Number(req.params.keyId) } });
    if (!key) {
      return next({ status: 404, message: 'API key not found.' });
    }

    await repo.remove(key);

    await createAuditLog({
      user: req.user,
      ip: req.ip,
      action: 'apiKey.delete',
      entityType: 'ApiKey',
      entityId: key.id,
      meta: { name: key.name },
    });

    return res.status(204).send();
  } catch (e) {
    logger.error('Error deleting API key', {
      label: 'API Key',
      errorMessage: e.message,
    });
    return next({ status: 500, message: 'Unable to delete API key.' });
  }
});

export default apiKeysRoutes;

