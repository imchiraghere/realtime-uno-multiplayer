import Redis from 'ioredis';
import { config } from './index';
import { logger } from '../utils/logger';

export const redis = new Redis(config.redisUrl, {
  retryStrategy: (times) => {
    if (times > 3) {
      logger.warn('Redis retry limit reached, running in standalone mode');
      return null;
    }
    return Math.min(times * 100, 1000);
  },
  maxRetriesPerRequest: 1,
  connectTimeout: 3000,
  enableOfflineQueue: false,
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error('Redis error', err));
