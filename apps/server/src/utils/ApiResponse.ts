import type { Response } from 'express'

type ResponseOptions<T> = {
  message?: string
  data?: T
  meta?: Record<string, any>
  statusCode?: number
}

export class ApiResponse {
  static success<T>(
    res: Response,
    { message = 'Success', data, meta, statusCode = 200 }: ResponseOptions<T>,
  ) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      meta,
    })
  }
}
