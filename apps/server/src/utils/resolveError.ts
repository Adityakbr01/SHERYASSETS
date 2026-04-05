// utils/resolveError.ts

import { ERROR_MAP } from './errorMap'

/**
 * 🔍 Recursive Message Finder
 * Hunts for a human-readable message in common SDK error formats (Razorpay, Stripe, Axios, etc.)
 */
interface ErrorWithResponse {
  message?: string
  description?: string
  msg?: string
  error?: {
    description?: string
    message?: string
  }
  response?: {
    data?: {
      message?: string
      description?: string
    }
  }
}

const findBestMessage = (err: unknown): string => {
  if (!err) return 'Something went wrong'

  // 1. Top-level properties
  if (typeof err === 'string') return err
  
  const e = err as ErrorWithResponse
  if (e.message) return e.message
  if (e.description) return e.description
  if (e.msg) return e.msg

  // 2. Nested developer-friendly structures (SDKs)
  if (e.error && typeof e.error === 'object') {
    if (e.error.description) return e.error.description
    if (e.error.message) return e.error.message
  }

  // 3. Axios / HTTP Client response data
  if (e.response?.data?.message) return e.response.data.message
  if (e.response?.data?.description) return e.response.data.description

  return 'Something went wrong'
}

export const resolveError = (err: unknown) => {
  const e = err as Record<string, unknown>

  // ─── 1. Run through ERROR_MAP ───────────────────────────────────────────
  for (const errorDef of ERROR_MAP) {
    // Check by custom logic if available
    if (errorDef.check && errorDef.check(err)) {
      return errorDef.handler(err)
    }

    // Check by name (supports Error instances and plain objects with names)
    if (e && (e.name === errorDef.name || (err instanceof Error && err.name === errorDef.name))) {
      return errorDef.handler(err)
    }
  }

  // ─── 2. Robust Fallback ────────────────────────────────────────────────
  // Even if not in map, we try to preserve status and hunt for a message
  const statusCode = (e?.statusCode as number) || (err instanceof Error ? 500 : 500)
  
  return {
    statusCode: typeof statusCode === 'number' ? statusCode : 500,
    message: findBestMessage(err),
    errors: (e?.errors as unknown[]) || [],
  }
}
