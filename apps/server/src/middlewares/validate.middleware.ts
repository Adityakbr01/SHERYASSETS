import type { NextFunction, Request, Response } from 'express'
import type { ZodType } from 'zod'
import { ApiError } from '../utils/ApiError'

type ValidatedRequestData = {
  body: unknown
  query: unknown
  params: unknown
}

export const validate =
  <T extends ValidatedRequestData>(schema: ZodType<T>) =>
  (req: Request, _res: Response, next: NextFunction): void => {
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

      req.body = result.data.body

      if (result.data.query && typeof result.data.query === 'object') {
        try {
          Object.assign(req.query, result.data.query)
        } catch {
          // Some test runtimes expose readonly query objects.
        }
      }

      if (result.data.params && typeof result.data.params === 'object') {
        try {
          Object.assign(req.params, result.data.params)
        } catch {
          // Some test runtimes expose readonly params objects.
        }
      }

      next()
    } catch (error) {
      next(error)
    }
  }
