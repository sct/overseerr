import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import NodeCache from 'node-cache';
import logger from '../logger';

// 5 minute default TTL
const DEFAULT_TTL = 300;

interface ExternalAPIOptions {
  nodeCache?: NodeCache;
  headers?: Record<string, unknown>;
}

class ExternalAPI {
  protected axios: AxiosInstance;
  private cache?: NodeCache;

  constructor(
    baseURL: string,
    params: Record<string, unknown>,
    options: ExternalAPIOptions = {}
  ) {
    this.axios = axios.create({
      baseURL,
      params,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
    });
    this.cache = options.nodeCache;
  }

  protected async get<T>(
    endpoint: string,
    config: AxiosRequestConfig,
    ttl?: number
  ): Promise<T> {
    const cacheKey = this.serializeCacheKey(endpoint, config.params);
    const cachedItem = this.cache?.get<T>(cacheKey);
    if (cachedItem) {
      logger.debug(`Loaded item from cache: ${cacheKey}`);
      return cachedItem;
    }

    const response = await this.axios.get<T>(endpoint, config);

    if (this.cache) {
      this.cache.set(cacheKey, response.data, ttl ?? DEFAULT_TTL);
    }

    return response.data;
  }

  private serializeCacheKey(
    endpoint: string,
    params?: Record<string, unknown>
  ) {
    if (!params) {
      return endpoint;
    }

    return `${endpoint}${JSON.stringify(params)}`;
  }
}

export default ExternalAPI;
