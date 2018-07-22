import * as IORedis from 'ioredis';
import { Service } from 'typedi';
import { Node } from '../entity/Node';

@Service()
export class RedisCache {
  private static redis: IORedis.Redis;

  /**
   * Connects to Redis
   * @param url The Redis URL
   */
  public static connect(url: string) {
    RedisCache.redis = new IORedis(url);
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
    await RedisCache.redis.set(value.id, val);
    await RedisCache.redis.expire(value.id, expire);
  }

  /**
   * Caches a single object in Redis with a custom key
   * @param key The redis key
   * @param value The object itself
   * @param expire (optional, default is 3600) Expiration (in seconds)
   */
  public async setKey(
    key: string,
    value: Node,
    expire: number = 3600
  ) {
    const val = JSON.stringify(value);
    await RedisCache.redis.set(key, val);
    await RedisCache.redis.expire(value.id, expire);
  }

  /**
   * Gets a cached object
   * @param id The object's ID
   */
  public async get<T>(id: string): Promise<T> {
    return RedisCache.redis.get(id).then((value) => {
      if (!value) return null;
      return JSON.parse(value);
    });
  }
}
