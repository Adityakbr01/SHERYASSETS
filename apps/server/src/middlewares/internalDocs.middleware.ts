import crypto from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'

import { env } from '@/configs/ENV'
import { ApiError } from '@/utils/ApiError'

const extractInternalDocsToken = (req: Request): string | null => {
  const headerToken = req.headers['x-internal-docs-token']

  if (typeof headerToken === 'string' && headerToken.trim().length > 0) {
    return headerToken.trim()
  }

  const authHeader = req.headers.authorization

  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.slice(7).trim()

    if (bearerToken.length > 0) {
      return bearerToken
    }
  }

  const queryToken = req.query.docs_token

  if (typeof queryToken === 'string' && queryToken.trim().length > 0) {
    return queryToken.trim()
  }

  return null
}

const isTokenMatch = (providedToken: string, expectedToken: string): boolean => {
  const providedBuffer = Buffer.from(providedToken)
  const expectedBuffer = Buffer.from(expectedToken)

  if (providedBuffer.length !== expectedBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(providedBuffer, expectedBuffer)
}

export const protectInternalDocs = (req: Request, _res: Response, next: NextFunction) => {
  const configuredToken = env.INTERNAL_DOCS_ACCESS_TOKEN.trim()

  if (!configuredToken) {
    if (env.NODE_ENV === 'production') {
      throw new ApiError({
        statusCode: 403,
        message:
          'Internal docs access is disabled. Configure INTERNAL_DOCS_ACCESS_TOKEN to enable it.',
      })
    }

    next()
    return
  }

  const providedToken = extractInternalDocsToken(req)

  if (!providedToken || !isTokenMatch(providedToken, configuredToken)) {
    throw new ApiError({
      statusCode: 401,
      message: 'Unauthorized internal docs access',
    })
  }

  next()
}
