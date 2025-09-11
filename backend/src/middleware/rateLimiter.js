import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import Redis from 'ioredis'; 

const redisClient = new Redis(env.process.env.REDIS_URL);

export const authRateLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: "rl:auth:",
  }),
  windowMs: 15 * 60 * 1000, 
  max: 5,
  message:
    "Too many login attempts from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});
