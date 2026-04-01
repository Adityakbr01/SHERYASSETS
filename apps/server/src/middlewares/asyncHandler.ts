import { logger } from '@/utils/logger'
import type { NextFunction, Request, Response } from 'express'

export const asyncHandler =
  (fn: any) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      logger.error('💀 ASYNC ERROR:', err)
      next(err)
    })
  }
