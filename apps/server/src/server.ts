import { logger } from '@/utils/logger'
import { env } from '@/configs/ENV'

// 🚀 START SERVER SAFELY
const startServer = async () => {
  try {
    logger.info('🚀 Starting server...')

    const { default: app } = await import('./app')

    const PORT = env.PORT

    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`)
    })

    // 🔥 graceful shutdown (VERY IMPORTANT)
    const shutdown = (signal: string) => {
      logger.warn(`⚠️ ${signal} received. Shutting down...`)

      server.close(() => {
        logger.info('✅ Server closed gracefully')
        process.exit(0)
      })
    }

    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
  } catch (error: any) {
    console.error('💀 SERVER START FAILED', error.message, error.stack)
  }
}

startServer()
