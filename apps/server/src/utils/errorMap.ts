// errorMap for mapping Global Errors to ApiErrors
export const ERROR_MAP = [
  {
    name: 'ZodError',
    handler: (err: unknown) => ({
      statusCode: 400,
      message: 'Validation failed',
      errors: (err as { issues: any[] }).issues.map((e: any) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    }),
  },

  {
    name: 'CastError',
    handler: (err: unknown) => ({
      statusCode: 400,
      message: `Invalid ${(err as { path: string }).path}: ${(err as { value: string }).value}`,
      errors: [],
    }),
  },

  {
    name: 'MongoDuplicate',
    check: (err: unknown) => (err as { code: number }).code === 11000,
    handler: (err: unknown) => {
      const field = Object.keys((err as { keyValue: any }).keyValue)[0]
      return {
        statusCode: 409,
        message: `${field} already exists`,
        errors: [{ field, message: `${field} already exists` }],
      }
    },
  },

  {
    name: 'ValidationError',
    handler: (err: unknown) => ({
      statusCode: 400,
      message: 'Database validation failed',
      errors: Object.values((err as { errors: any }).errors).map((e: any) => ({
        field: e.path,
        message: e.message,
      })),
    }),
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
    handler: (err: unknown) => ({
      statusCode: (err as { statusCode: number }).statusCode,
      message: (err as { message: string }).message,
      errors: (err as { errors: any[] }).errors || [],
    }),
  },
]
