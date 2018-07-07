import * as IORedis from 'ioredis';

/**
 * The primary Redis connection
 */
export let redis: IORedis.Redis;

/**
 * Connects to Redis
 * @param url The Redis URL
 */
export function connectToRedis(url: string) {
  redis = new IORedis(url);
}

/**
 * Generates a Redis key
 * @param type The type of the object
 * @param idComponents Parts of the object's primary key
 */
function makeKey(type: string, idComponents: string[]) {
  return type + '-' + idComponents.join('-');
}

/**
 * Caches a single object in Redis
 * @param type The type of the object
 * @param idComponents Parts of the object's primary key
 * @param value The object itself
 * @param expire (optional, default is 3600) Expiration (in seconds)
 */
export async function cache(
  type: string,
  idComponents: string[],
  value: any,
  expire: number = 3600
) {
  const val = JSON.stringify(value);
  const key = makeKey(type, idComponents);
  await redis.set(key, val);
  await redis.expire(key, expire);
}

/**
 * Gets a cached object
 * @param type The type of the object
 * @param idComponents Parts of the object's primary key
 */
export async function getCached<T>(type: string, idComponents: string[]): Promise<T> {
  const key = makeKey(type, idComponents);
  return redis.get(key).then((value) => {
    if (!value) return null;
    return JSON.parse(value);
  });
}
