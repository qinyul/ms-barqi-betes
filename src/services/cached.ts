import { RedisClientType } from "@redis/client";
import { createClient } from "redis";

export const createRedisClient = async () => {
  let redisClient: RedisClientType;
  let isClientError = false;
  const redisHost = process.env.REDIS_HOST;
  const redisPort = process.env.REDIS_PORT;
  const isValidRedistHost = redisHost && redisPort;

  const getClient = async () => {
    try {
      if (redisClient === undefined) {
        console.log("getClient:: Creating redis client");
        redisClient = createClient({
          url: `redis://${redisHost}:${redisPort}`,
        });
        await redisClient.connect();
      }
    } catch (err: any) {
      console.error(`getClient:: error: ${err?.message}`);
    }

    return redisClient;
  };

  const getCachedData = async (
    key: string,
    callback: () => Promise<any>,
    ttl?: number
  ) => {
    if (!isValidRedistHost || isClientError) {
      return callback();
    }

    try {
      const client = await getClient();
      let data = await client.get(key);
      if (!data) {
        console.log("getCachedData:: failed to get data from cache");
        data = await callback();
        if (ttl === undefined) {
          await client.set(key, JSON.stringify(data));
        } else {
          await client.set(key, JSON.stringify(data));
        }
      } else {
        console.log("getCachedData:: getting data from cache");
        data = JSON.parse(data);
      }

      return data;
    } catch (err: any) {
      console.error("getCachedData:: cache error ", { err, key });
    }
  };

  return {
    getCachedData,
  };
};
