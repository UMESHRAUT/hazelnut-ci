import redis from "redis";
import { promisify } from "util";

interface ConnectRedisResult {
  client: redis.RedisClient;

  get: (arg0: string) => Promise<string>;

  set: (arg0: string, arg1: string) => Promise<unknown>;
}

export function connectRedis(): ConnectRedisResult {
  const client = redis.createClient();

  client.on("connect", function() {
    console.log("Redis client connected");
  });

  client.on("error", function(error) {
    console.error(error);
  });

  const get = promisify(client.get).bind(client);

  const set = promisify(client.set).bind(client);

  return {
    client,
    get,
    set
  };
}
