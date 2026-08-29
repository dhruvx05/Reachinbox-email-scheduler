import Redis from 'ioredis';
import { config } from '../config/env';

export const redisClient = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null, // Required by BullMQ
});

redisClient.on('connect', () => {
  console.log('⚡ Redis connected successfully');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis Connection Error:', err.message);
});

export const parseRedisUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || 'localhost',
      port: parseInt(parsed.port || '6379', 10),
      password: parsed.password || undefined,
    };
  } catch {
    return { host: 'localhost', port: 6379 };
  }
};
