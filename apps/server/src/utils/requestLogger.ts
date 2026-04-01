import { randomUUID } from 'crypto'
import { logger } from '@/utils/logger'
import type { NextFunction, Request, Response } from 'express'

export const requestLogger = (
  req: Request & { requestId?: string },
  res: Response,
  next: NextFunction,
) => {
  const start = Date.now()
  const requestId = randomUUID()

  req.requestId = requestId
  res.setHeader('X-Request-Id', requestId)

  res.on('finish', () => {
    const duration = Date.now() - start

    // 🎨 method color
    const methodColors: Record<string, string> = {
      GET: '\x1b[32mGET\x1b[0m', // green
      POST: '\x1b[33mPOST\x1b[0m', // yellow
      PUT: '\x1b[34mPUT\x1b[0m', // blue
      PATCH: '\x1b[36mPATCH\x1b[0m', // cyan
      DELETE: '\x1b[31mDELETE\x1b[0m', // red
    }

    // 🎨 status color
    let statusColor = '\x1b[32m' // green
    if (res.statusCode >= 500) statusColor = '\x1b[31m'
    else if (res.statusCode >= 400) statusColor = '\x1b[33m'

    const coloredStatus = `${statusColor}${res.statusCode}\x1b[0m`

    // ⚡ slow request highlight
    const timeColor =
      duration > 1000 ? '\x1b[31m' : duration > 500 ? '\x1b[33m' : '\x1b[32m'

    const coloredTime = `${timeColor}${duration}ms\x1b[0m`

    const method = methodColors[req.method] || req.method

    const message = `${method} ${req.originalUrl} ${coloredStatus} ${coloredTime}`

    const meta = {
      requestId,
      module: 'HTTP',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    }

    if (res.statusCode >= 500) {
      logger.error(message, meta)
    } else if (res.statusCode >= 400) {
      logger.warn(message, meta)
    } else {
      logger.info(message, meta)
    }
  })

  next()
}
