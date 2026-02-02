import NodeCache from 'node-cache';
import RedisCache from './cache/redis';
import { getSettings } from './settings';

export type AvailableCacheIds =
  | 'tmdb'
  | 'radarr'
  | 'sonarr'
  | 'lidarr'
  | 'musicbrainz'
  | 'rt'
  | 'imdb'
  | 'github'
  | 'plexguid'
  | 'plextv'
  | 'plexwatchlist'
  | 'fanart';

const DEFAULT_TTL = 300;
const DEFAULT_CHECK_PERIOD = 120;

class Cache {
  public id: AvailableCacheIds;
  public data: NodeCache;
  public redis?: RedisCache;
  public name: string;
  private useRedis: boolean;
  private defaultTtl: number;
  private redisInitialized = false;

  constructor(
    id: AvailableCacheIds,
    name: string,
    options: { stdTtl?: number; checkPeriod?: number } = {}
  ) {
    this.id = id;
    this.name = name;
    this.defaultTtl = options.stdTtl ?? DEFAULT_TTL;

    // Always initialize NodeCache (required for ExternalAPI compatibility)
    this.data = new NodeCache({
      stdTTL: this.defaultTtl,
      checkperiod: options.checkPeriod ?? DEFAULT_CHECK_PERIOD,
    });

    // Initialize Redis if enabled (async, non-blocking)
    const settings = getSettings();
    this.useRedis = settings.main.redis?.enabled ?? false;

    if (this.useRedis) {
      this.redis = new RedisCache({
        enabled: true,
        host: settings.main.redis.host,
        port: settings.main.redis.port,
        password: settings.main.redis.password,
        db: settings.main.redis.db,
        keyPrefix: `${settings.main.redis.keyPrefix}${id}:`,
      });

      // Connect asynchronously, don't block initialization
      this.redis
        .connect()
        .then(() => {
          this.redisInitialized = true;
        })
        .catch(() => {
          // Fallback to NodeCache if Redis fails
          this.useRedis = false;
          this.redisInitialized = false;
        });
    }
  }

  // Synchronous get for NodeCache compatibility (ExternalAPI expects this)
  public get<T>(key: string): T | undefined {
    return this.data.get<T>(key);
  }

  // Synchronous set for NodeCache compatibility
  public set(key: string, value: unknown, ttl?: number): boolean {
    const result = this.data.set(key, value, ttl ?? this.defaultTtl);

    // Async write to Redis (fire and forget)
    if (this.useRedis && this.redis && this.redisInitialized) {
      const cacheTtl = ttl ?? this.defaultTtl;
      this.redis.set(key, value, cacheTtl).catch(() => {
        // Silently fail if Redis write fails
      });
    }

    return result;
  }

  // Synchronous del for NodeCache compatibility
  public del(key: string | string[]): number {
    const result = this.data.del(key);

    // Async delete from Redis
    if (this.useRedis && this.redis && this.redisInitialized) {
      const keys = Array.isArray(key) ? key : [key];
      const redis = this.redis;
      Promise.all(keys.map((k) => redis.del(k))).catch(() => {
        // Silently fail if Redis delete fails
      });
    }

    return result;
  }

  public getStats() {
    return this.data.getStats();
  }

  public flush(): void {
    this.data.flushAll();
    if (this.useRedis && this.redis && this.redisInitialized) {
      this.redis.flush().catch(() => {
        // Silently fail if Redis flush fails
      });
    }
  }

  // Async method to warm cache from Redis on startup
  public async warmFromRedis(): Promise<void> {
    if (!this.useRedis || !this.redis || !this.redisInitialized) {
      return;
    }

    // This would require implementing keys() in RedisCache
    // For now, we'll use write-through caching (write to both, read from NodeCache)
  }
}

class CacheManager {
  private availableCaches: Record<AvailableCacheIds, Cache> = {
    tmdb: new Cache('tmdb', 'The Movie Database API', {
      stdTtl: 21600,
      checkPeriod: 60 * 30,
    }),
    radarr: new Cache('radarr', 'Radarr API'),
    sonarr: new Cache('sonarr', 'Sonarr API'),
    lidarr: new Cache('lidarr', 'Lidarr API'),
    musicbrainz: new Cache('musicbrainz', 'MusicBrainz API', {
      stdTtl: 3600,
      checkPeriod: 60 * 30,
    }),
    rt: new Cache('rt', 'Rotten Tomatoes API', {
      stdTtl: 43200,
      checkPeriod: 60 * 30,
    }),
    imdb: new Cache('imdb', 'IMDB Radarr Proxy', {
      stdTtl: 43200,
      checkPeriod: 60 * 30,
    }),
    github: new Cache('github', 'GitHub API', {
      stdTtl: 21600,
      checkPeriod: 60 * 30,
    }),
    plexguid: new Cache('plexguid', 'Plex GUID', {
      stdTtl: 86400 * 7, // 1 week cache
      checkPeriod: 60 * 30,
    }),
    plextv: new Cache('plextv', 'Plex TV', {
      stdTtl: 86400 * 7, // 1 week cache
      checkPeriod: 60,
    }),
    plexwatchlist: new Cache('plexwatchlist', 'Plex Watchlist'),
    fanart: new Cache('fanart', 'Fanart.tv API'),
  };

  public getCache(id: AvailableCacheIds): Cache {
    return this.availableCaches[id];
  }

  public getAllCaches(): Record<string, Cache> {
    return this.availableCaches;
  }
}

const cacheManager = new CacheManager();

export default cacheManager;
