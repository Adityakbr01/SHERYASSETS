import type { CookieOptions } from 'express'
import { env } from './ENV'

const isProd = env.NODE_ENV === 'production'

const commonCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
}

const parseDurationToMs = (value: string, fallback: number): number => {
  const match = value
    .trim()
    .toLowerCase()
    .match(/^(\d+)(ms|s|m|h|d)$/)

  if (!match) {
    return fallback
  }

  const amountPart = match[1]
  const unit = match[2]

  if (!amountPart || !unit) {
    return fallback
  }

  const amount = Number(amountPart)

  const unitToMs: Record<'ms' | 's' | 'm' | 'h' | 'd', number> = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  }

  return amount * unitToMs[unit as keyof typeof unitToMs]
}

export const accessTokenCookieOptions: CookieOptions = {
  ...commonCookieOptions,
  maxAge: parseDurationToMs(env.JWT_EXPIRES_IN, 60 * 60 * 1000),
}

export const refreshTokenCookieOptions: CookieOptions = {
  ...commonCookieOptions,
  maxAge: parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN, 7 * 24 * 60 * 60 * 1000),
}

// Backward-compatible export for modules still importing cookieOptions.
export const cookieOptions = refreshTokenCookieOptions
