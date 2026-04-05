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

type RazorpayErrorLike = {
  statusCode?: number
  error: {
    code: string
    description: string
    field?: string
    metadata?: Record<string, unknown>
    reason?: string
  }
}

export const ERROR_MAP = [
  // ─── 1. Zod Validation Errors ──────────────────────────────────────────────
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

  // ─── 2. Mongoose Cast Errors (Invalid ID format, etc.) ──────────────────────
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

  // ─── 3. Mongo Duplicate Key Errors ─────────────────────────────────────────
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

  // ─── 4. Mongoose Schema Validation Errors ──────────────────────────────────
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

  // ─── 5. Razorpay SDK Errors ───────────────────────────────────────────────
  {
    name: 'RazorpayError',
    check: (err: unknown) => {
      const e = err as RazorpayErrorLike
      return (
        e !== null &&
        e.error !== undefined &&
        typeof e.error === 'object' &&
        'description' in e.error
      )
    },
    handler: (err: unknown) => {
      const rErr = err as RazorpayErrorLike
      return {
        statusCode: rErr.statusCode || 400,
        message: rErr.error.description,
        errors: [
          {
            field: rErr.error.field || 'gateway',
            message: rErr.error.description,
          },
        ],
      }
    },
  },

  // ─── 6. JWT Errors ────────────────────────────────────────────────────────
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

  // ─── 7. Custom ApiError ───────────────────────────────────────────────────
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
