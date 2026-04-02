import { env } from '@/configs/ENV'
import { connectDB, disconnectDB } from '@/lib/db'
import { logger } from '@/utils/logger'
import { emailWorker } from '@/workers/email.worker'
import PlanService from '@/modules/Plan/plan.service'
import app from './app'

// START SERVER SAFELY
const startServer = async () => {
  try {
    logger.info('Starting server...')

    await connectDB()

    // ─── Seed default plans into DB ──────────────────────────────────────
    await PlanService.seedDefaults()

    const PORT = env.PORT
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`)
    })

    const shutdown = async (signal: string) => {
      logger.warn(`⚠️ ${signal} received. Shutting down...`)

      server.close(async () => {
        try {
          await emailWorker.close()
          await disconnectDB()
          logger.info('✅ Server closed gracefully')
          process.exit(0)
        } catch (error) {
          logger.error('💀 Error during shutdown', { error })
          process.exit(1)
        }
      })
    }

    process.on('SIGINT', () => {
      void shutdown('SIGINT')
    })

    process.on('SIGTERM', () => {
      void shutdown('SIGTERM')
    })
  } catch (error: unknown) {
    logger.error('SERVER START FAILED', {
      error:
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : { message: 'Unknown startup error', value: error },
    })
  }
}

startServer()
