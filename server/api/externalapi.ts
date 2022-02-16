import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { isIP, isIPv4 } from 'net';
import NodeCache from 'node-cache';
import { getSettings } from '../lib/settings';

// 5 minute default TTL (in seconds)
const DEFAULT_TTL = 300;

// 10 seconds default rolling buffer (in ms)
const DEFAULT_ROLLING_BUFFER = 10000;

interface ExternalAPIOptions {
  nodeCache?: NodeCache;
  headers?: Record<string, unknown>;
}

class ExternalAPI {
  protected axios: AxiosInstance;
  private baseUrl: string;
  private cache?: NodeCache;

  constructor(
    baseUrl: string,
    params: Record<string, unknown>,
    options: ExternalAPIOptions = {}
  ) {
    this.axios = this.createAxiosInstance(baseUrl, params, options);
    this.baseUrl = baseUrl;
    this.cache = options.nodeCache;
  }

  protected async get<T>(
    endpoint: string,
    config?: AxiosRequestConfig,
    ttl?: number
  ): Promise<T> {
    const cacheKey = this.serializeCacheKey(endpoint, config?.params);
    const cachedItem = this.cache?.get<T>(cacheKey);
    if (cachedItem) {
      return cachedItem;
    }

    const response = await this.axios.get<T>(endpoint, config);

    if (this.cache) {
      this.cache.set(cacheKey, response.data, ttl ?? DEFAULT_TTL);
    }

    return response.data;
  }

  protected async getRolling<T>(
    endpoint: string,
    config?: AxiosRequestConfig,
    ttl?: number
  ): Promise<T> {
    const cacheKey = this.serializeCacheKey(endpoint, config?.params);
    const cachedItem = this.cache?.get<T>(cacheKey);

    if (cachedItem) {
      const keyTtl = this.cache?.getTtl(cacheKey) ?? 0;

      // If the item has passed our rolling check, fetch again in background
      if (
        keyTtl - (ttl ?? DEFAULT_TTL) * 1000 <
        Date.now() - DEFAULT_ROLLING_BUFFER
      ) {
        this.axios.get<T>(endpoint, config).then((response) => {
          this.cache?.set(cacheKey, response.data, ttl ?? DEFAULT_TTL);
        });
      }
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
      return `${this.baseUrl}${endpoint}`;
    }

    return `${this.baseUrl}${endpoint}${JSON.stringify(params)}`;
  }

  private createAxiosInstance(
    baseUrl: string,
    params: Record<string, unknown>,
    options: ExternalAPIOptions
  ) {
    // very much like Go's `net.IsPrivate`
    const isPrivateIP = (ip: string): boolean => {
      if (isIP(ip) === 0) {
        return false;
      }

      let splitIP: number[];
      if (isIPv4(ip)) {
        splitIP = ip.split('.').map((v) => parseInt(v, 10));
        return (
          splitIP[0] === 10 ||
          (splitIP[0] === 172 && (splitIP[1] & 240) === 16) ||
          splitIP[0] === 192
        );
      } else {
        splitIP = ip.split(':').map((v) => parseInt(v, 16));
        return (isNaN(splitIP[0]) ? 0 : splitIP[0] & 254) === 252;
      }
    };

    const proxySettings = getSettings().proxy;

    const useProxy =
      proxySettings.enabled &&
      !proxySettings.options.ignoredAddresses.some(
        (ignoredAddress) => this.baseUrl === ignoredAddress,
        this
      ) &&
      !(proxySettings.options.bypassLocalAddresses && isPrivateIP(this.baseUrl))
        ? true
        : false;

    return axios.create({
      baseURL: baseUrl,
      params,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
      proxy: useProxy
        ? {
            protocol: proxySettings.options.useSSL ? 'https' : 'http',
            host: proxySettings.options.hostname,
            port: proxySettings.options.port,
            auth:
              proxySettings.options.authUser && proxySettings.options.authPass
                ? {
                    username: proxySettings.options.authUser,
                    password: proxySettings.options.authPass,
                  }
                : undefined,
          }
        : false,
    });
  }
}

export default ExternalAPI;
