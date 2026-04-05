// utils/resolveError.ts

import { ERROR_MAP } from './errorMap'

/**
 * 🔍 Recursive Message Finder
 * Hunts for a human-readable message in common SDK error formats (Razorpay, Stripe, Axios, etc.)
 */
const findBestMessage = (err: any): string => {
  if (!err) return 'Something went wrong'

  // 1. Top-level properties
  if (typeof err === 'string') return err
  if (err.message) return err.message
  if (err.description) return err.description
  if (err.msg) return err.msg

  // 2. Nested developer-friendly structures (SDKs)
  if (err.error && typeof err.error === 'object') {
    if (err.error.description) return err.error.description
    if (err.error.message) return err.error.message
  }

  // 3. Axios / HTTP Client response data
  if (err.response?.data?.message) return err.response.data.message
  if (err.response?.data?.description) return err.response.data.description

  return 'Something went wrong'
}

export const resolveError = (err: unknown) => {
  const errObj = err as any

  // ─── 1. Run through ERROR_MAP ───────────────────────────────────────────
  for (const errorDef of ERROR_MAP) {
    // Check by custom logic if available
    if (errorDef.check && errorDef.check(err)) {
      return errorDef.handler(err)
    }

    // Check by name (supports Error instances and plain objects with names)
    if (errObj && (errObj.name === errorDef.name || (err instanceof Error && err.name === errorDef.name))) {
      return errorDef.handler(err)
    }
  }

  // ─── 2. Robust Fallback ────────────────────────────────────────────────
  // Even if not in map, we try to preserve status and hunt for a message
  const statusCode = errObj?.statusCode || (err instanceof Error ? 500 : 500)
  
  return {
    statusCode: typeof statusCode === 'number' ? statusCode : 500,
    message: findBestMessage(err),
    errors: errObj?.errors || [],
  }
}
