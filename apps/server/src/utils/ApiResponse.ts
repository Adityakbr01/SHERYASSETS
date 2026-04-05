import type { Response } from 'express'

type ResponseOptions<T> = {
  message?: string
  data?: T
  meta?: Record<string, unknown>
  statusCode?: number
  isCache?: boolean
}

export class ApiResponse {
  static success<T>(
    res: Response,
    { message = 'Success', data, meta = {}, statusCode = 200, isCache = false }: ResponseOptions<T>,
  ) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      meta: {
        ...meta,
        isCache,
      },
    })
  }
}
