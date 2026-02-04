import { Permission } from '@server/lib/permissions';
import type { Request, Response } from 'express';
import { vi } from 'vitest';

// Mock user factory
export interface MockUser {
  id: number;
  email: string;
  plexUsername?: string;
  permissions: number;
  avatar?: string;
  userType: number;
  settings?: {
    notificationTypes?: {
      webpush?: boolean;
    };
  };
}

export const createMockUser = (
  overrides: Partial<MockUser> = {}
): MockUser => ({
  id: 1,
  email: 'test@example.com',
  plexUsername: 'testuser',
  permissions: Permission.REQUEST,
  avatar: '/avatar.jpg',
  userType: 1,
  ...overrides,
});

export const createAdminUser = (overrides: Partial<MockUser> = {}): MockUser =>
  createMockUser({
    permissions: Permission.ADMIN,
    ...overrides,
  });

// Mock request factory
export const createMockRequest = (
  overrides: Partial<Request> = {}
): Partial<Request> => ({
  user: createMockUser(),
  body: {},
  params: {},
  query: {},
  ip: '127.0.0.1',
  locale: 'en',
  ...overrides,
});

// Mock response factory
export const createMockResponse = (): {
  res: Partial<Response>;
  jsonMock: ReturnType<typeof vi.fn>;
  statusMock: ReturnType<typeof vi.fn>;
} => {
  const jsonMock = vi.fn();
  const statusMock = vi.fn().mockReturnThis();

  const res: Partial<Response> = {
    status: statusMock,
    json: jsonMock,
  };

  // Make status().json() work correctly
  statusMock.mockImplementation(() => ({
    json: jsonMock,
  }));

  return { res, jsonMock, statusMock };
};

// Mock next function
export const createMockNext = () => vi.fn();

// Repository mock helpers
export const createMockRepository = () => ({
  find: vi.fn(),
  findOne: vi.fn(),
  findOneOrFail: vi.fn(),
  findOneBy: vi.fn(),
  save: vi.fn(),
  create: vi.fn(),
  delete: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  count: vi.fn(),
  createQueryBuilder: vi.fn(() => ({
    where: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    orWhere: vi.fn().mockReturnThis(),
    leftJoinAndSelect: vi.fn().mockReturnThis(),
    innerJoinAndSelect: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    take: vi.fn().mockReturnThis(),
    getOne: vi.fn(),
    getMany: vi.fn(),
    getManyAndCount: vi.fn(),
    getCount: vi.fn(),
  })),
});

// Media request mock
export interface MockMediaRequest {
  id: number;
  status: number;
  type: 'movie' | 'tv';
  media: {
    id: number;
    tmdbId: number;
    mediaType: 'movie' | 'tv';
    status: number;
  };
  requestedBy: MockUser;
  modifiedBy?: MockUser;
  is4k: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const createMockMediaRequest = (
  overrides: Partial<MockMediaRequest> = {}
): MockMediaRequest => ({
  id: 1,
  status: 1, // PENDING
  type: 'movie',
  media: {
    id: 1,
    tmdbId: 12345,
    mediaType: 'movie',
    status: 3, // PROCESSING
  },
  requestedBy: createMockUser(),
  is4k: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Settings mock
export const createMockSettings = () => ({
  main: {
    apiKey: 'test-api-key',
    newPlexLogin: true,
    defaultPermissions: Permission.REQUEST,
  },
  public: {
    initialized: true,
  },
  plex: {
    libraries: [],
  },
  fullPublicSettings: {
    initialized: true,
  },
  load: vi.fn().mockReturnThis(),
  save: vi.fn(),
});

// Request status enum (mirrors the actual enum)
export enum MediaRequestStatus {
  PENDING = 1,
  APPROVED = 2,
  DECLINED = 3,
}

// Media status enum
export enum MediaStatus {
  UNKNOWN = 1,
  PENDING = 2,
  PROCESSING = 3,
  PARTIALLY_AVAILABLE = 4,
  AVAILABLE = 5,
}
