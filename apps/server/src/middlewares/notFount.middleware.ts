import type { Application, NextFunction, Request, Response } from 'express'

export const notFoundMiddleware = (app: Application) => {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const error: Error & { statusCode?: number } = new Error(
      `Route not found: ${req.originalUrl}`,
    )
    error.statusCode = 404
    next(error)
  })
}
