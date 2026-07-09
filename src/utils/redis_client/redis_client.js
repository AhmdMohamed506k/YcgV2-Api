import { createClient } from 'redis';
import Redis from "ioredis";
import dotenv from 'dotenv';
dotenv.config();



const redisClient = new Redis(process.env.REDIS_URL, {
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redisClient.on("connect", () => console.log("Connected to Upstash Redis!"));
redisClient.on("error", (err) => console.error("Redis Error:", err));

export default redisClient;

