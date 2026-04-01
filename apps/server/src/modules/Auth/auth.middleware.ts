import jwt from 'jsonwebtoken'
import type { NextFunction, Request, Response } from 'express'

import { env } from '@/configs/ENV'
import { asyncHandler } from '@/middlewares/asyncHandler'
import { ApiError } from '@/utils/ApiError'

import AuthDAO from './auth.dao'

const extractAccessToken = (
  authorizationHeader?: string,
  accessTokenFromCookie?: string,
): string | null => {
  if (authorizationHeader?.startsWith('Bearer ')) {
    const bearerToken = authorizationHeader.slice(7).trim()

    if (bearerToken.length > 0) {
      return bearerToken
    }
  }

  if (accessTokenFromCookie && accessTokenFromCookie.length > 0) {
    return accessTokenFromCookie
  }

  return null
}

export const requireAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const accessTokenFromCookie =
      typeof req.cookies?.accessToken === 'string' ? req.cookies.accessToken : undefined

    const token = extractAccessToken(req.headers.authorization, accessTokenFromCookie)

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

    if (typeof decoded !== 'object' || typeof decoded.userId !== 'string') {
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
