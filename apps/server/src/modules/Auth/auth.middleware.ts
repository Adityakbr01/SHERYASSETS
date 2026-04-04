import jwt from 'jsonwebtoken'
import type { NextFunction, Request, Response } from 'express'

import { env } from '@/configs/ENV'
import { asyncHandler } from '@/middlewares/asyncHandler'
import { ApiError } from '@/utils/ApiError'

import AuthDAO from './auth.dao'

/**
 * Lightweight auth guard used within the Auth module routes.
 * For full tenant-aware auth, use the centralized middlewares in /middlewares/auth.middleware.ts
 */

const extractAccessToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization

  if (authHeader?.startsWith('Bearer ')) {
    const bearerToken = authHeader.slice(7).trim()

    if (bearerToken.length > 0) return bearerToken
  }

  const cookieToken = req.cookies?.accessToken

  if (typeof cookieToken === 'string' && cookieToken.length > 0) {
    return cookieToken
  }

  return null
}

export const requireAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const token = extractAccessToken(req)

    if (!token) {
      throw new ApiError({
        statusCode: 401,
        message: 'Unauthorized: access token missing',
      })
    }

    let decoded: string | jwt.JwtPayload

    try {
      decoded = jwt.verify(token, env.JWT_SECRET)
    } catch {
      throw new ApiError({
        statusCode: 401,
        message: 'Unauthorized: invalid or expired access token',
      })
    }

    if (!decoded || typeof decoded !== 'object' || !('userId' in decoded) || typeof decoded.userId !== 'string') {
      throw new ApiError({
        statusCode: 401,
        message: 'Unauthorized: invalid token payload',
      })
    }

    const user = await AuthDAO.findById(decoded.userId)

    if (!user) {
      throw new ApiError({
        statusCode: 401,
        message: 'Unauthorized: user not found',
      })
    }

    req.user = user
    next()
  },
)
