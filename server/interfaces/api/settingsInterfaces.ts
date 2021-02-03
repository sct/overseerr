export interface SettingsAboutResponse {
  version: string;
  totalRequests: number;
  totalMediaItems: number;
  tz?: string;
}

export interface PublicSettingsResponse {
  initialized: boolean;
  movie4kEnabled: boolean;
  series4kEnabled: boolean;
  hideAvailable: boolean;
  localLogin: boolean;
}

export interface CacheItem {
  id: string;
  name: string;
  stats: {
    hits: number;
    misses: number;
    keys: number;
    ksize: number;
    vsize: number;
  };
}
