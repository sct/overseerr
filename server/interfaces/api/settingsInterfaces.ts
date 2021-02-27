export interface SettingsAboutResponse {
  version: string;
  totalRequests: number;
  totalMediaItems: number;
  tz?: string;
}

export interface PublicSettingsResponse {
  initialized: boolean;
  applicationTitle: string;
  hideAvailable: boolean;
  localLogin: boolean;
  movie4kEnabled: boolean;
  series4kEnabled: boolean;
  region: string;
  originalLanguage: string;
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
