import Redis from 'ioredis';

export const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    if (times > 2) {
      return null; // Stop retrying after 2 attempts
    }
    return Math.min(times * 100, 1000);
  },
  lazyConnect: true, // Don't connect immediately
  maxRetriesPerRequest: 1,
});

redisClient.on('error', (err) => {
  // Silently handle errors - Redis is optional
});

redisClient.on('connect', () => console.log('✓ Redis connected'));
