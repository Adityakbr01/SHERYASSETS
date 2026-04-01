import mongoose from 'mongoose'

import { env } from '@/configs/ENV'
import { logger } from '@/utils/logger'

export const connectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) {
    return
  }

  await mongoose.connect(env.DB_URL)
  logger.info(`🗄️ MongoDB connected: ${mongoose.connection.host}`)
}

export const disconnectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState === 0) {
    return
  }

  await mongoose.disconnect()
  logger.info('🛑 MongoDB disconnected')
}
