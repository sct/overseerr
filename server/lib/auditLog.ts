import { getRepository } from '@server/datasource';
import { AuditLog } from '@server/entity/AuditLog';
import type { User } from '@server/entity/User';
import logger from '@server/logger';

export interface AuditLogCreateOptions {
  user?: User;
  ip?: string;
  action: string;
  entityType?: string;
  entityId?: string | number;
  meta?: Record<string, unknown>;
}

export const createAuditLog = async (
  options: AuditLogCreateOptions
): Promise<void> => {
  try {
    const repo = getRepository(AuditLog);
    const entry = repo.create({
      user: options.user,
      ip: options.ip,
      action: options.action,
      entityType: options.entityType,
      entityId:
        options.entityId === undefined || options.entityId === null
          ? undefined
          : String(options.entityId),
      meta: options.meta,
    });

    await repo.save(entry);
  } catch (e) {
    logger.debug('Failed to write audit log', {
      label: 'AuditLog',
      errorMessage: e instanceof Error ? e.message : String(e),
    });
  }
};

