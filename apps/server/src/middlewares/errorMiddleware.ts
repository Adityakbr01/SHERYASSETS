import { env } from '@/configs/ENV'
import { logger } from '@/utils/logger'
import { resolveError } from '@/utils/resolveError'
import type { NextFunction, Request, Response } from 'express'

/**
 * 🚨 Global Error Handler
 * Consistently handles all types of errors (ApiError, Zod, Mongo, Razorpay, etc.)
 */
export const errorHandler = (
  err: unknown,
  req: Request & { requestId?: string },
  res: Response,
  _next: NextFunction,
) => {
  const { statusCode, message, errors } = resolveError(err)

  // 📝 LOG ERROR (Contextual Logging)
  if (env.NODE_ENV === 'development') {
    logger.error(`${message}`, {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode,
      err, // Full error object for console/logs
    })
  } else {
    // In production: only log detailed stack traces for 500+ Internal Server Errors
    logger.error(`${message} | ${statusCode}`, {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      ...(statusCode >= 500 && { err }),
    })
  }

  // 📦 STANDARDIZED API RESPONSE
  res.status(statusCode).json({
    success: false,
    message,
    errors: errors || [],
    ...(env.NODE_ENV === 'development' && {
      stack: err instanceof Error ? err.stack : 'No stack trace available',
      detail:
        (err as Record<string, unknown>)?.error || (err as Record<string, unknown>)?.message,
    }),
  })
}
