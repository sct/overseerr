import NodeCache from 'node-cache';

type AvailableCacheIds = 'tmdb' | 'radarr' | 'sonarr' | 'rt';

interface Cache {
  id: AvailableCacheIds;
  data: NodeCache;
}

const DEFAULT_TTL = 300;
const DEFAULT_CHECK_PERIOD = 120;

class CacheManager {
  private availableCaches: Record<AvailableCacheIds, Cache> = {
    tmdb: {
      id: 'tmdb',
      data: new NodeCache({
        stdTTL: DEFAULT_TTL,
        checkperiod: DEFAULT_CHECK_PERIOD,
      }),
    },
    radarr: {
      id: 'radarr',
      data: new NodeCache({
        stdTTL: DEFAULT_TTL,
        checkperiod: DEFAULT_CHECK_PERIOD,
      }),
    },
    sonarr: {
      id: 'sonarr',
      data: new NodeCache({
        stdTTL: DEFAULT_TTL,
        checkperiod: DEFAULT_CHECK_PERIOD,
      }),
    },
    rt: {
      id: 'rt',
      data: new NodeCache({
        stdTTL: 21600, // 12 hours TTL
        checkperiod: 60 * 30, // 30 minutes check period
      }),
    },
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
