import * as IORedis from 'ioredis';
import { Service } from 'typedi';
import { Node } from '../entity/Node';
import { REDIS_URL } from '..';

@Service()
export class RedisCache {
  private redis: IORedis.Redis;

  constructor() {
    this.redis = new IORedis(REDIS_URL);
  }

  /**
   * Caches a single object in Redis
   * @param value The object itself
   * @param expire (optional, default is 3600) Expiration (in seconds)
   */
  public async set(
    value: Node,
    expire: number = 3600
  ) {
    const val = JSON.stringify(value);
    await this.redis.set(value.id, val);
    await this.redis.expire(value.id, expire);
  }

  /**
   * Caches a single object in Redis with a custom key
   * @param key The redis key
   * @param value The object itself
   * @param expire (optional, default is 3600) Expiration (in seconds)
   */
  public async setKey(
    key: string,
    value: any,
    expire: number = 3600
  ) {
    const val = JSON.stringify(value);
    await this.redis.set(key, val);
    if (expire) await this.redis.expire(key, expire);
  }

  /**
   * Gets a cached object
   * @param id The object's ID
   */
  public async get<T>(id: string): Promise<T> {
    return this.redis.get(id).then((value) => {
      if (!value) return null;
      return JSON.parse(value);
    });
  }
}
