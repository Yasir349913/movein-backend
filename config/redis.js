// config/redis.js - Updated with queue config
import Redis from "redis";
import { env } from "./env.js";

export const redis = Redis.createClient({
  url: env.REDIS_URL,
});

export const redisConfig = {
  ttl: {
    short: 60 * 5,        // 5 minutes
    medium: 60 * 30,      // 30 minutes
    long: 60 * 60 * 24,   // 24 hours
  },
  
  prefixes: {
    session: "sess:",
    user: "user:",
    book: "book:",
    config: "config:",
    queue: "queue:",
  },
  
  // Add this queue configuration
  queue: {
    defaultJobOptions: {
      removeOnComplete: 10,
      removeOnFail: 5,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    },
  },
};

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", (err) => console.error("❌ Redis error:", err));