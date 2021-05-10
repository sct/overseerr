import type { PaginatedResponse } from './common';

export type LogMessage = {
  timestamp: string;
  level: string;
  label: string;
  message: string;
  data?: Record<string, unknown>;
};

export interface LogsResultsResponse extends PaginatedResponse {
  results: LogMessage[];
}

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
  partialRequestsEnabled: boolean;
  cacheImages: boolean;
  vapidPublic: string;
  enablePushRegistration: boolean;
  locale: string;
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

export interface StatusResponse {
  version: string;
  commitTag: string;
  updateAvailable: boolean;
  commitsBehind: number;
}

export interface ServicesResponse {
  plex: { name: string; url: string; connected: boolean };
  radarr: {
    name: string;
    url?: string;
    connected: boolean;
  }[];
  sonarr: {
    name: string;
    url?: string;
    connected: boolean;
  }[];
}
