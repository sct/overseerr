import type { User } from '@server/entity/User';
import type { PaginatedResponse } from './common';

export interface AuditLogItem {
  id: number;
  action: string;
  entityType?: string;
  entityId?: string;
  ip?: string;
  meta?: Record<string, unknown>;
  user?: Pick<User, 'id' | 'displayName' | 'avatar'>;
  createdAt: Date;
}

export interface AuditLogResultsResponse extends PaginatedResponse {
  results: AuditLogItem[];
}

