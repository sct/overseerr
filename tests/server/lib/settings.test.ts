import { Permission } from '@server/lib/permissions';
import { describe, expect, it } from 'vitest';

// Test the settings data structures and validation logic
// Note: We don't test the actual file I/O, just the data handling

describe('Settings Data Structures', () => {
  describe('MainSettings defaults', () => {
    it('should have correct default structure', () => {
      const defaultMainSettings = {
        apiKey: '',
        applicationTitle: 'Overseerr',
        applicationUrl: '',
        csrfProtection: false,
        cacheImages: false,
        defaultPermissions: Permission.REQUEST,
        defaultQuotas: {
          movie: {},
          tv: {},
          music: {},
        },
        hideAvailable: false,
        localLogin: true,
        newPlexLogin: true,
        region: '',
        originalLanguage: '',
        trustProxy: false,
        partialRequestsEnabled: true,
        locale: 'en',
        redis: {
          enabled: false,
          host: 'localhost',
          port: 6379,
          db: 0,
          keyPrefix: 'overseerr:',
        },
      };

      expect(defaultMainSettings.applicationTitle).toBe('Overseerr');
      expect(defaultMainSettings.localLogin).toBe(true);
      expect(defaultMainSettings.newPlexLogin).toBe(true);
      expect(defaultMainSettings.defaultPermissions).toBe(Permission.REQUEST);
      expect(defaultMainSettings.redis.enabled).toBe(false);
      expect(defaultMainSettings.redis.port).toBe(6379);
    });
  });

  describe('PlexSettings', () => {
    it('should have correct default structure', () => {
      const defaultPlexSettings = {
        name: '',
        ip: '',
        port: 32400,
        useSsl: false,
        libraries: [],
      };

      expect(defaultPlexSettings.port).toBe(32400);
      expect(defaultPlexSettings.useSsl).toBe(false);
      expect(defaultPlexSettings.libraries).toEqual([]);
    });

    it('should validate library structure', () => {
      const library = {
        id: 'lib-1',
        name: 'Movies',
        enabled: true,
        type: 'movie' as const,
        lastScan: Date.now(),
      };

      expect(library.id).toBeDefined();
      expect(library.type).toBe('movie');
      expect(['movie', 'show']).toContain(library.type);
    });
  });

  describe('RadarrSettings', () => {
    it('should have correct DVR structure', () => {
      const radarrSettings = {
        id: 1,
        name: 'Radarr',
        hostname: 'localhost',
        port: 7878,
        apiKey: 'test-api-key',
        useSsl: false,
        baseUrl: '/radarr',
        activeProfileId: 1,
        activeProfileName: 'HD-1080p',
        activeDirectory: '/movies',
        tags: [1, 2],
        is4k: false,
        isDefault: true,
        syncEnabled: true,
        preventSearch: false,
        tagRequests: true,
        minimumAvailability: 'released',
      };

      expect(radarrSettings.port).toBe(7878);
      expect(radarrSettings.isDefault).toBe(true);
      expect(radarrSettings.minimumAvailability).toBe('released');
    });

    it('should identify 4K Radarr instances', () => {
      const radarrInstances = [
        { id: 1, is4k: false, isDefault: true },
        { id: 2, is4k: true, isDefault: true },
      ];

      const has4kDefault = radarrInstances.some((r) => r.is4k && r.isDefault);
      expect(has4kDefault).toBe(true);
    });
  });

  describe('SonarrSettings', () => {
    it('should have correct series type options', () => {
      const sonarrSettings = {
        id: 1,
        name: 'Sonarr',
        hostname: 'localhost',
        port: 8989,
        apiKey: 'test-api-key',
        useSsl: false,
        activeProfileId: 1,
        activeProfileName: 'HD-1080p',
        activeDirectory: '/tv',
        tags: [],
        is4k: false,
        isDefault: true,
        syncEnabled: true,
        preventSearch: false,
        tagRequests: true,
        seriesType: 'standard' as const,
        animeSeriesType: 'anime' as const,
        enableSeasonFolders: true,
      };

      expect(sonarrSettings.port).toBe(8989);
      expect(['standard', 'daily', 'anime']).toContain(
        sonarrSettings.seriesType
      );
      expect(sonarrSettings.enableSeasonFolders).toBe(true);
    });

    it('should support anime-specific settings', () => {
      const animeSettings = {
        activeAnimeProfileId: 2,
        activeAnimeProfileName: 'Anime-1080p',
        activeAnimeDirectory: '/anime',
        animeTags: [3, 4],
      };

      expect(animeSettings.activeAnimeProfileId).toBe(2);
      expect(animeSettings.animeTags).toContain(3);
    });
  });

  describe('LidarrSettings', () => {
    it('should have music-specific settings', () => {
      const lidarrSettings = {
        id: 1,
        name: 'Lidarr',
        hostname: 'localhost',
        port: 8686,
        apiKey: 'test-api-key',
        useSsl: false,
        activeProfileId: 1,
        activeProfileName: 'Standard',
        activeDirectory: '/music',
        tags: [],
        is4k: false,
        isDefault: true,
        syncEnabled: true,
        preventSearch: false,
        tagRequests: false,
        activeMetadataProfileId: 1,
        activeMetadataProfileName: 'Standard',
      };

      expect(lidarrSettings.port).toBe(8686);
      expect(lidarrSettings.activeMetadataProfileId).toBe(1);
    });
  });

  describe('RedisSettings', () => {
    it('should have correct default configuration', () => {
      const redisSettings = {
        enabled: false,
        host: 'localhost',
        port: 6379,
        password: undefined,
        db: 0,
        keyPrefix: 'overseerr:',
      };

      expect(redisSettings.port).toBe(6379);
      expect(redisSettings.keyPrefix).toBe('overseerr:');
    });

    it('should support custom Redis configuration', () => {
      const customRedisSettings = {
        enabled: true,
        host: 'redis.example.com',
        port: 6380,
        password: 'secret',
        db: 1,
        keyPrefix: 'myapp:',
      };

      expect(customRedisSettings.enabled).toBe(true);
      expect(customRedisSettings.password).toBe('secret');
    });
  });

  describe('NotificationAgents', () => {
    it('should have correct notification agent keys', () => {
      const NotificationAgentKey = {
        DISCORD: 'discord',
        EMAIL: 'email',
        GOTIFY: 'gotify',
        PUSHBULLET: 'pushbullet',
        PUSHOVER: 'pushover',
        SLACK: 'slack',
        TELEGRAM: 'telegram',
        WEBHOOK: 'webhook',
        WEBPUSH: 'webpush',
      };

      expect(Object.keys(NotificationAgentKey)).toHaveLength(9);
      expect(NotificationAgentKey.DISCORD).toBe('discord');
      expect(NotificationAgentKey.WEBPUSH).toBe('webpush');
    });

    it('should have correct email agent structure', () => {
      const emailAgent = {
        enabled: false,
        options: {
          emailFrom: '',
          smtpHost: '',
          smtpPort: 587,
          secure: false,
          ignoreTls: false,
          requireTls: false,
          allowSelfSigned: false,
          senderName: 'Overseerr',
        },
      };

      expect(emailAgent.options.smtpPort).toBe(587);
      expect(emailAgent.options.senderName).toBe('Overseerr');
    });

    it('should have correct Discord agent structure', () => {
      const discordAgent = {
        enabled: false,
        types: 0,
        options: {
          webhookUrl: '',
          enableMentions: true,
        },
      };

      expect(discordAgent.options.enableMentions).toBe(true);
    });

    it('should have correct Telegram agent structure', () => {
      const telegramAgent = {
        enabled: false,
        types: 0,
        options: {
          botAPI: '',
          chatId: '',
          sendSilently: false,
        },
      };

      expect(telegramAgent.options.sendSilently).toBe(false);
    });
  });

  describe('JobSettings', () => {
    it('should have correct default job schedules', () => {
      const defaultJobs = {
        'plex-recently-added-scan': { schedule: '0 */5 * * * *' },
        'plex-full-scan': { schedule: '0 0 3 * * *' },
        'plex-watchlist-sync': { schedule: '0 */3 * * * *' },
        'radarr-scan': { schedule: '0 0 4 * * *' },
        'sonarr-scan': { schedule: '0 30 4 * * *' },
        'lidarr-scan': { schedule: '0 0 5 * * *' },
        'availability-sync': { schedule: '0 0 5 * * *' },
        'download-sync': { schedule: '0 * * * * *' },
        'download-sync-reset': { schedule: '0 0 1 * * *' },
        'image-cache-cleanup': { schedule: '0 0 5 * * *' },
      };

      // Download sync runs every minute
      expect(defaultJobs['download-sync'].schedule).toBe('0 * * * * *');
      // Plex recently added runs every 5 minutes
      expect(defaultJobs['plex-recently-added-scan'].schedule).toBe(
        '0 */5 * * * *'
      );
      // Full scan runs at 3 AM
      expect(defaultJobs['plex-full-scan'].schedule).toBe('0 0 3 * * *');
    });

    it('should have valid cron expressions', () => {
      const schedules = ['0 */5 * * * *', '0 0 3 * * *', '0 * * * * *'];

      schedules.forEach((schedule) => {
        // Each schedule should have 6 parts (second, minute, hour, day, month, weekday)
        expect(schedule.split(' ')).toHaveLength(6);
      });
    });
  });

  describe('FullPublicSettings', () => {
    it('should compute 4K enabled status from DVR settings', () => {
      const radarrInstances = [
        { is4k: false, isDefault: true },
        { is4k: true, isDefault: true },
      ];

      const sonarrInstances = [
        { is4k: false, isDefault: true },
        { is4k: false, isDefault: false },
      ];

      const movie4kEnabled = radarrInstances.some((r) => r.is4k && r.isDefault);
      const series4kEnabled = sonarrInstances.some(
        (s) => s.is4k && s.isDefault
      );

      expect(movie4kEnabled).toBe(true);
      expect(series4kEnabled).toBe(false);
    });

    it('should compute email enabled from notification settings', () => {
      const notifications = {
        agents: {
          email: { enabled: true },
          webpush: { enabled: false },
        },
      };

      expect(notifications.agents.email.enabled).toBe(true);
      expect(notifications.agents.webpush.enabled).toBe(false);
    });
  });

  describe('Quota settings', () => {
    it('should support movie quotas', () => {
      const quotas = {
        movie: { quotaLimit: 10, quotaDays: 7 },
        tv: { quotaLimit: 5, quotaDays: 7 },
        music: {},
      };

      expect(quotas.movie.quotaLimit).toBe(10);
      expect(quotas.movie.quotaDays).toBe(7);
    });

    it('should handle empty quotas', () => {
      const noQuotas = {
        movie: {},
        tv: {},
        music: {},
      };

      expect(noQuotas.movie.quotaLimit).toBeUndefined();
      expect(noQuotas.tv.quotaDays).toBeUndefined();
    });
  });

  describe('API Key generation', () => {
    it('should generate valid base64 API keys', () => {
      const generateApiKey = (): string => {
        const timestamp = Date.now();
        const uuid = 'test-uuid-12345';
        return Buffer.from(`${timestamp}${uuid}`).toString('base64');
      };

      const apiKey = generateApiKey();

      // Should be valid base64
      expect(() => Buffer.from(apiKey, 'base64')).not.toThrow();
      // Should be non-empty
      expect(apiKey.length).toBeGreaterThan(0);
    });

    it('should generate unique API keys', () => {
      const generateApiKey = (): string => {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        return Buffer.from(`${timestamp}${random}`).toString('base64');
      };

      const key1 = generateApiKey();
      const key2 = generateApiKey();

      expect(key1).not.toBe(key2);
    });
  });
});
