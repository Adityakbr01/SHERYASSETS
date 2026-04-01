// errorMap for mapping Global Errors to ApiErrors
type ErrorField = {
  field?: string
  message: string
}

type ZodIssueLike = {
  path?: Array<string | number>
  message?: string
}

type ZodErrorLike = {
  issues?: ZodIssueLike[]
}

type CastErrorLike = {
  path?: string
  value?: unknown
}

type MongoDuplicateLike = {
  code?: number
  keyValue?: Record<string, unknown>
}

type ValidationIssueLike = {
  path?: string
  message?: string
}

type ValidationErrorLike = {
  errors?: Record<string, ValidationIssueLike>
}

type ApiErrorLike = {
  statusCode?: number
  message?: string
  errors?: ErrorField[]
}

export const ERROR_MAP = [
  {
    name: 'ZodError',
    handler: (err: unknown) => ({
      statusCode: 400,
      message: 'Validation failed',
      errors: ((err as ZodErrorLike).issues ?? []).map((issue) => ({
        field: (issue.path ?? []).map(String).join('.'),
        message: issue.message ?? 'Invalid value',
      })),
    }),
  },

  {
    name: 'CastError',
    handler: (err: unknown) => {
      const castError = err as CastErrorLike

      return {
        statusCode: 400,
        message: `Invalid ${castError.path ?? 'value'}: ${String(castError.value ?? '')}`,
        errors: [],
      }
    },
  },

  {
    name: 'MongoDuplicate',
    check: (err: unknown) => (err as MongoDuplicateLike).code === 11000,
    handler: (err: unknown) => {
      const keyValue = (err as MongoDuplicateLike).keyValue ?? {}
      const [field = 'field'] = Object.keys(keyValue)

      return {
        statusCode: 409,
        message: `${field} already exists`,
        errors: [{ field, message: `${field} already exists` }],
      }
    },
  },

  {
    name: 'ValidationError',
    handler: (err: unknown) => {
      const validationItems = Object.values((err as ValidationErrorLike).errors ?? {})

      return {
        statusCode: 400,
        message: 'Database validation failed',
        errors: validationItems.map((issue) => ({
          field: issue.path ?? 'unknown',
          message: issue.message ?? 'Invalid value',
        })),
      }
    },
  },

  {
    name: 'JsonWebTokenError',
    handler: () => ({
      statusCode: 401,
      message: 'Invalid token',
      errors: [],
    }),
  },

  {
    name: 'TokenExpiredError',
    handler: () => ({
      statusCode: 401,
      message: 'Token expired',
      errors: [],
    }),
  },

  {
    name: 'ApiError',
    handler: (err: unknown) => {
      const apiError = err as ApiErrorLike

      return {
        statusCode: apiError.statusCode ?? 500,
        message: apiError.message ?? 'Something went wrong',
        errors: apiError.errors ?? [],
      }
    },
  },
]
