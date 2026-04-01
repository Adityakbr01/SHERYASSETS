import { env } from '@/configs/ENV'
import { resolveError } from '@/utils/resolveError'
import type { NextFunction, Request, Response } from 'express'

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const { statusCode, message, errors } = resolveError(err)

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(env.NODE_ENV === 'development' && {
      stack: err instanceof Error ? err.stack : 'No stack trace available',
    }),
  })
}
