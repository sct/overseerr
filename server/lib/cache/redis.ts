import { createClient, type RedisClientOptions } from 'redis';
import logger from '@server/logger';

export interface RedisCacheOptions {
  enabled: boolean;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
}

class RedisCache {
  private client: ReturnType<typeof createClient> | null = null;
  private options: RedisCacheOptions;
  private connected = false;

  constructor(options: RedisCacheOptions) {
    this.options = options;
  }

  public async connect(): Promise<void> {
    if (!this.options.enabled || this.connected) {
      return;
    }

    try {
      const clientOptions: RedisClientOptions = {
        socket: {
          host: this.options.host || 'localhost',
          port: this.options.port || 6379,
        },
        ...(this.options.password && { password: this.options.password }),
        ...(this.options.db && { database: this.options.db }),
      };

      this.client = createClient(clientOptions);

      this.client.on('error', (err) => {
        logger.error('Redis client error', {
          label: 'Redis',
          errorMessage: err.message,
        });
      });

      await this.client.connect();
      this.connected = true;
      logger.info('Redis cache connected', { label: 'Redis' });
    } catch (e) {
      logger.warn('Failed to connect to Redis, falling back to in-memory cache', {
        label: 'Redis',
        errorMessage: e instanceof Error ? e.message : String(e),
      });
      this.connected = false;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client && this.connected) {
      await this.client.quit();
      this.connected = false;
    }
  }

  private getKey(key: string): string {
    const prefix = this.options.keyPrefix || 'overseerr:';
    return `${prefix}${key}`;
  }

  public async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.connected) {
      return null;
    }

    try {
      const value = await this.client.get(this.getKey(key));
      return value ? (JSON.parse(value) as T) : null;
    } catch (e) {
      logger.debug('Redis get error', {
        label: 'Redis',
        errorMessage: e instanceof Error ? e.message : String(e),
      });
      return null;
    }
  }

  public async set(
    key: string,
    value: unknown,
    ttlSeconds?: number
  ): Promise<void> {
    if (!this.client || !this.connected) {
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setEx(this.getKey(key), ttlSeconds, serialized);
      } else {
        await this.client.set(this.getKey(key), serialized);
      }
    } catch (e) {
      logger.debug('Redis set error', {
        label: 'Redis',
        errorMessage: e instanceof Error ? e.message : String(e),
      });
    }
  }

  public async del(key: string): Promise<void> {
    if (!this.client || !this.connected) {
      return;
    }

    try {
      await this.client.del(this.getKey(key));
    } catch (e) {
      logger.debug('Redis del error', {
        label: 'Redis',
        errorMessage: e instanceof Error ? e.message : String(e),
      });
    }
  }

  public async flush(): Promise<void> {
    if (!this.client || !this.connected) {
      return;
    }

    try {
      const prefix = this.getKey('*');
      const keys = await this.client.keys(prefix);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (e) {
      logger.debug('Redis flush error', {
        label: 'Redis',
        errorMessage: e instanceof Error ? e.message : String(e),
      });
    }
  }

  public isConnected(): boolean {
    return this.connected;
  }
}

export default RedisCache;
