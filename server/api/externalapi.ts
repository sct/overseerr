import logger from '@server/logger';
import type {
  AxiosInstance,
  AxiosProxyConfig,
  AxiosRequestConfig,
  CreateAxiosDefaults,
} from 'axios';
import axios from 'axios';
import rateLimit from 'axios-rate-limit';
import { HttpsProxyAgent } from 'https-proxy-agent';
import type { NeedleOptions } from 'needle';
import needle from 'needle';
import type NodeCache from 'node-cache';

// 5 minute default TTL (in seconds)
const DEFAULT_TTL = 300;

// 10 seconds default rolling buffer (in ms)
const DEFAULT_ROLLING_BUFFER = 10000;

interface ExternalAPIOptions {
  nodeCache?: NodeCache;
  headers?: Record<string, unknown>;
  rateLimit?: {
    maxRPS: number;
    maxRequests: number;
  };
}

class ExternalAPI {
  protected axios: AxiosInstance;
  protected proxy: AxiosProxyConfig;
  private baseUrl: string;
  private cache?: NodeCache;
  protected config?: CreateAxiosDefaults;
  private headers: { [key: string]: string };
  private params: Record<string, unknown>;

  constructor(
    baseUrl: string,
    params: Record<string, unknown>,
    options: ExternalAPIOptions = {}
  ) {
    this.headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36',
      ...options.headers,
    };

    this.params = params;

    this.config = {
      baseURL: baseUrl,
      params: this.params,
      headers: this.headers,
    };

    if (process.env.HTTPS_PROXY) {
      const parsedUrl = new URL(process.env.HTTPS_PROXY);
      const port = parseInt(parsedUrl.port);
      this.proxy = {
        host: parsedUrl.hostname,
        port: port,
        auth: {
          username: parsedUrl.username,
          password: parsedUrl.password,
        },
        protocol: port == 443 ? 'https' : 'http',
      };
      this.config.proxy = this.proxy;
    }

    this.axios = axios.create(this.config);

    if (options.rateLimit) {
      this.axios = rateLimit(this.axios, {
        maxRequests: options.rateLimit.maxRequests,
        maxRPS: options.rateLimit.maxRPS,
      });
    }

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

    const params = {
      ...config?.params,
      ...this.params,
    };

    const args = '?' + new URLSearchParams(params).toString();
    const path = new URL(endpoint + args, this.baseUrl);
    const request: NeedleOptions = {
      json: true,
      headers: this.headers,
    };

    if (process.env.HTTPS_PROXY) {
      request.agent = new HttpsProxyAgent(process.env.HTTPS_PROXY);
    }

    return needle('get', path.toString(), request)
      .then((res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode <= 400) {
          return res.body;
        } else {
          logger.error(
            'Failed to get %s, reason %s',
            path.toString(),
            res.statusMessage
          );
          return res.body;
        }
      })
      .then((data) => {
        if (this.cache) {
          this.cache.set(cacheKey, data, ttl ?? DEFAULT_TTL);
        }
        return data;
      });
  }

  protected async post<T>(
    endpoint: string,
    data: Record<string, unknown>,
    config?: AxiosRequestConfig,
    ttl?: number
  ): Promise<T> {
    const cacheKey = this.serializeCacheKey(endpoint, {
      config: config?.params,
      data,
    });
    const cachedItem = this.cache?.get<T>(cacheKey);
    if (cachedItem) {
      return cachedItem;
    }

    const response = await this.axios.post<T>(endpoint, data, config);

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
}

export default ExternalAPI;
