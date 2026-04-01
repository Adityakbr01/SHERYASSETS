import type { NextFunction, Request, Response } from 'express'
import type { ZodSchema } from 'zod'
import { ApiError } from '../utils/ApiError'

export const validate =
  (schema: ZodSchema<any>) => (req: Request, _res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
      })

      if (!result.success) {
        const formattedErrors = result.error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }))

        return next(
          new ApiError({
            statusCode: 400,
            message: 'Validation failed',
            errors: formattedErrors,
          }),
        )
      }

      // overwrite with validated data (safe 🔥)
      req.body = result.data.body
      req.query = result.data.query
      req.params = result.data.params

      next()
    } catch (error) {
      next(error)
    }
  }
