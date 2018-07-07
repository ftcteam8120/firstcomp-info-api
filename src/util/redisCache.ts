import * as IORedis from 'ioredis';
import { Service } from 'typedi';

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
   * Generates a Redis key
   * @param type The type of the object
   * @param idComponents Parts of the object's primary key
   */
  private makeKey(type: string, idComponents: string[]) {
    return type + '-' + idComponents.join('-');
  }

  /**
   * Caches a single object in Redis
   * @param type The type of the object
   * @param idComponents Parts of the object's primary key
   * @param value The object itself
   * @param expire (optional, default is 3600) Expiration (in seconds)
   */
  public async set(
    type: string,
    idComponents: string[],
    value: any,
    expire: number = 3600
  ) {
    const val = JSON.stringify(value);
    const key = this.makeKey(type, idComponents);
    await RedisCache.redis.set(key, val);
    await RedisCache.redis.expire(key, expire);
  }

  /**
   * Gets a cached object
   * @param type The type of the object
   * @param idComponents Parts of the object's primary key
   */
  public async get<T>(type: string, idComponents: string[]): Promise<T> {
    const key = this.makeKey(type, idComponents);
    return RedisCache.redis.get(key).then((value) => {
      if (!value) return null;
      return JSON.parse(value);
    });
  }
}
