import { logger } from '@/utils/logger'
import type { NextFunction, Request, Response } from 'express'

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void | Response>

export const asyncHandler =
  (fn: AsyncRequestHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch((err: unknown) => {
      logger.error('ASYNC ERROR', { err })
      next(err)
    })
  }
