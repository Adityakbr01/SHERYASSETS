import { logger } from '@/utils/logger'
import { env } from './ENV'
import Redis from 'ioredis'

// Create a robust Redis connection using ioredis
export const redisConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
})

redisConnection.on('error', (error) => {
  logger.error('Redis connection error:', error)
})

redisConnection.on('connect', () => {
  logger.info('Redis connected successfully')
})
