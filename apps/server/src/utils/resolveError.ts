// utils/resolveError.ts

import { ERROR_MAP } from './errorMap'

export const resolveError = (err: unknown) => {
  for (const errorDef of ERROR_MAP) {
    // custom check (like Mongo duplicate)
    if (errorDef.check && errorDef.check(err)) {
      return errorDef.handler(err)
    }

    // match by name
    if (err instanceof Error && err.name === errorDef.name) {
      return errorDef.handler(err)
    }
  }

  // fallback
  return {
    statusCode: (err as { statusCode: number }).statusCode || 500,
    message: (err as { message: string }).message || 'Something went wrong',
    errors: [],
  }
}
