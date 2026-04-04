import type { Request, Response } from 'express'
import { asyncHandler } from '@/middlewares/asyncHandler'
import { ApiResponse } from '@/utils/ApiResponse'
import { ApiError } from '@/utils/ApiError'
import { accessTokenCookieOptions, refreshTokenCookieOptions } from '@/configs/cookieOptions'
import AuthService from './auth.service'

const AuthController = {
  sendRegisterOtp: asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body

    await AuthService.sendRegisterOtp(email)

    ApiResponse.success(res, {
      message: 'OTP sent to email if it is not already registered',
      meta: { email },
    })
  }),

  register: asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password, orgName, otp } = req.body

    const result = await AuthService.register({ name, email, password, orgName, otp })

    res.cookie('accessToken', result.accessToken, accessTokenCookieOptions)
    res.cookie('refreshToken', result.refreshToken, refreshTokenCookieOptions)

    ApiResponse.success(res, {
      statusCode: 201,
      message: 'Registration successful',
      data: {
        user: result.user,
        tenants: result.tenants,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    })
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body

    const result = await AuthService.login({ email, password })

    res.cookie('accessToken', result.accessToken, accessTokenCookieOptions)
    res.cookie('refreshToken', result.refreshToken, refreshTokenCookieOptions)

    ApiResponse.success(res, {
      message: 'Login successful',
      data: {
        user: result.user,
        tenants: result.tenants,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    })
  }),

  switchTenant: asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = req.body

    if (!tenantId || typeof tenantId !== 'string') {
      throw new ApiError({ statusCode: 400, message: 'tenantId is required' })
    }

    if (!req.user) {
      throw new ApiError({ statusCode: 401, message: 'Authentication required' })
    }

    const result = await AuthService.switchTenant(
      req.user._id.toString(),
      tenantId,
    )

    res.cookie('accessToken', result.accessToken, accessTokenCookieOptions)

    ApiResponse.success(res, {
      message: 'Tenant switched successfully',
      data: {
        accessToken: result.accessToken,
        tenant: result.tenant,
      },
    })
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const refreshToken =
      req.body.refreshToken ||
      (typeof req.cookies?.refreshToken === 'string' ? req.cookies.refreshToken : null)

    if (!refreshToken) {
      throw new ApiError({ statusCode: 400, message: 'Refresh token is required' })
    }

    const result = await AuthService.refresh(refreshToken)

    res.cookie('accessToken', result.accessToken, accessTokenCookieOptions)
    res.cookie('refreshToken', result.refreshToken, refreshTokenCookieOptions)

    ApiResponse.success(res, {
      message: 'Token refreshed successfully',
      data: {
        user: result.user,
        tenants: result.tenants,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    })
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const refreshToken =
      req.body.refreshToken ||
      (typeof req.cookies?.refreshToken === 'string' ? req.cookies.refreshToken : null)

    await AuthService.logout({
      userId: req.user?._id?.toString(),
      refreshToken,
    })

    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')

    ApiResponse.success(res, {
      message: 'Logged out successfully',
    })
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError({ statusCode: 401, message: 'Authentication required' })
    }

    const data = await AuthService.getCurrentUser(req.user._id.toString())

    ApiResponse.success(res, {
      message: 'Current user fetched',
      data,
    })
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body

    await AuthService.forgotPassword(email)

    ApiResponse.success(res, {
      message: 'Password reset link sent to your email',
      meta: { email },
    })
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = req.body

    await AuthService.resetPassword(token, password)

    ApiResponse.success(res, {
      message: 'Password reset successful',
    })
  }),
}

export default AuthController
