import {
    accessTokenCookieOptions,
    refreshTokenCookieOptions,
} from '@/configs/cookieOptions'
import { asyncHandler } from '@/middlewares/asyncHandler'
import { ApiError } from '@/utils/ApiError'
import { ApiResponse } from '@/utils/ApiResponse'
import type { Request, Response } from 'express'

import AuthService from './auth.service'

const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
): void => {
  res.cookie('accessToken', accessToken, accessTokenCookieOptions)
  res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions)
}

const clearAuthCookies = (res: Response): void => {
  res.clearCookie('accessToken', accessTokenCookieOptions)
  res.clearCookie('refreshToken', refreshTokenCookieOptions)
}

const AuthController = {
  sendRegisterOtp: asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body

    await AuthService.sendRegisterOtp(email)

    return ApiResponse.success(res, {
      message: 'OTP sent to your email successfully. It is valid for 5 minutes.',
    })
  }),

  register: asyncHandler(async (req: Request, res: Response) => {
    const { user, accessToken, refreshToken } = await AuthService.register(req.body)

    setAuthCookies(res, accessToken, refreshToken)

    return ApiResponse.success(res, {
      statusCode: 201,
      message: 'Registration successful',
      data: {
        user,
        accessToken,
      },
    })
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { user, accessToken, refreshToken } = await AuthService.login(req.body)

    setAuthCookies(res, accessToken, refreshToken)

    return ApiResponse.success(res, {
      message: 'Login successful',
      data: {
        user,
        accessToken,
      },
    })
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const tokenFromBody =
      typeof req.body?.refreshToken === 'string' ? req.body.refreshToken : undefined
    const tokenFromCookie =
      typeof req.cookies?.refreshToken === 'string' ? req.cookies.refreshToken : undefined

    const refreshToken = tokenFromBody ?? tokenFromCookie

    if (!refreshToken) {
      throw new ApiError({
        statusCode: 401,
        message: 'Refresh token not found',
      })
    }

    const {
      user,
      accessToken,
      refreshToken: nextRefreshToken,
    } = await AuthService.refresh(refreshToken)

    setAuthCookies(res, accessToken, nextRefreshToken)

    return ApiResponse.success(res, {
      message: 'Token refreshed successfully',
      data: {
        user,
        accessToken,
      },
    })
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const tokenFromBody =
      typeof req.body?.refreshToken === 'string' ? req.body.refreshToken : undefined
    const tokenFromCookie =
      typeof req.cookies?.refreshToken === 'string' ? req.cookies.refreshToken : undefined

    await AuthService.logout({
      userId: req.user?._id.toString(),
      refreshToken: tokenFromBody ?? tokenFromCookie,
    })

    clearAuthCookies(res)

    return ApiResponse.success(res, {
      message: 'Logout successful',
    })
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError({
        statusCode: 401,
        message: 'Unauthorized',
      })
    }

    const user = await AuthService.getCurrentUser(req.user._id.toString())

    return ApiResponse.success(res, {
      message: 'Current user fetched successfully',
      data: { user },
    })
  }),
}

export default AuthController
