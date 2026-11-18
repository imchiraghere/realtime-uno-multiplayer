import Redis from 'ioredis';
import { config } from './index';
import { logger } from '../utils/logger';

export const redis = new Redis(config.redisUrl, {
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error('Redis error', err));
