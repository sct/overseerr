import NodeCache from 'node-cache';

type AvailableCacheIds = 'tmdb' | 'radarr' | 'sonarr' | 'rt';

interface Cache {
  id: AvailableCacheIds;
  data: NodeCache;
  defaultTtl?: number;
  checkPeriod?: number;
}

const DEFAULT_TTL = 300;
const DEFAULT_CHECK_PERIOD = 120;

class CacheManager {
  private availableCaches: Record<string, Cache> = {};

  public registerCache(
    cache: Omit<Cache, 'data'> | Omit<Cache, 'data'>[]
  ): void {
    if (Array.isArray(cache)) {
      cache.forEach((cache) => {
        this.availableCaches[cache.id] = {
          id: cache.id,
          defaultTtl: cache.defaultTtl ?? DEFAULT_TTL,
          checkPeriod: cache.checkPeriod ?? DEFAULT_CHECK_PERIOD,
          data: new NodeCache({
            stdTTL: cache.defaultTtl ?? DEFAULT_TTL,
            checkperiod: cache.checkPeriod ?? DEFAULT_CHECK_PERIOD,
          }),
        };
      });
      return;
    }

    this.availableCaches[cache.id] = {
      id: cache.id,
      defaultTtl: cache.defaultTtl,
      checkPeriod: cache.checkPeriod,
      data: new NodeCache({
        stdTTL: cache.defaultTtl,
        checkperiod: cache.checkPeriod,
      }),
    };
  }

  public getCache(id: AvailableCacheIds): Cache | undefined {
    return this.availableCaches[id];
  }

  public getAllCaches(): Record<string, Cache> {
    return this.availableCaches;
  }
}

const cacheManager = new CacheManager();

cacheManager.registerCache([
  {
    id: 'tmdb',
  },
  {
    id: 'radarr',
  },
  {
    id: 'sonarr',
  },
  {
    id: 'rt',
    defaultTtl: 21600, // 12 Hours TTL
    checkPeriod: 60 * 30,
  },
]);

export default cacheManager;
