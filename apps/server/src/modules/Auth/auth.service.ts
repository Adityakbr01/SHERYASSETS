import { randomUUID } from 'crypto'
import jwt from 'jsonwebtoken'

import { logger } from '@/utils/logger'
import { sendEmail } from '@/utils/sendEmail'
import { ApiError } from '@/utils/ApiError'
import type { IUser, PublicUser } from '@/modules/User/user.type'
import { env } from '@/configs/ENV'
import { redisConnection } from '@/configs/redis'

import AuthDAO from './auth.dao'

type RegisterInput = {
  name: string
  email: string
  password: string
  tenantId?: string
  otp: string
}

type LoginInput = {
  email: string
  password: string
}

type LogoutInput = {
  userId?: string
  refreshToken?: string
}

type AuthResult = {
  user: PublicUser
  accessToken: string
  refreshToken: string
}

const normalizeEmail = (email: string): string => email.trim().toLowerCase()

const toPublicUser = (user: IUser): PublicUser => ({
  _id: user._id.toString(),
  name: user.name,
  email: user.email,
  isEmailVerified: user.isEmailVerified,
  role: user.role,
  tenantId: user.tenantId,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
})

const verifyRefreshToken = (refreshToken: string): string => {
  let decoded: string | jwt.JwtPayload

  try {
    decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET)
  } catch {
    throw new ApiError({
      statusCode: 401,
      message: 'Invalid or expired refresh token',
    })
  }

  if (typeof decoded !== 'object' || typeof decoded.userId !== 'string') {
    throw new ApiError({
      statusCode: 401,
      message: 'Invalid refresh token payload',
    })
  }

  return decoded.userId
}

const getWelcomeEmailContent = (name: string): string => `
  <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
    <h2>Welcome to SheryAssets, ${name}!</h2>
    <p>Your account is ready. You can now login and start using the dashboard.</p>
    <p>Thanks,<br/>SheryAssets Team</p>
  </div>
`

const AuthService = {
  async sendRegisterOtp(email: string): Promise<void> {
    const normalizedEmail = normalizeEmail(email)

    const existingUser = await AuthDAO.findByEmail(normalizedEmail)

    if (existingUser) {
      throw new ApiError({
        statusCode: 409,
        message: 'User with this email already exists',
      })
    }

    const cooldownKey = `cooldown:register:${normalizedEmail}`
    const hasCooldown = await redisConnection.get(cooldownKey)

    if (hasCooldown) {
      throw new ApiError({
        statusCode: 429,
        message: 'Please wait before requesting another OTP',
      })
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    const otpKey = `otp:register:${normalizedEmail}`
    await redisConnection.set(otpKey, otp, 'EX', 300) // 5 minutes TTL
    await redisConnection.set(cooldownKey, '1', 'EX', 60) // 1 minute cooldown

    const htmlContent = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
        <h2>SheryAssets Registration OTP</h2>
        <p>Your OTP for registration is: <strong>${otp}</strong></p>
        <p>This OTP is valid for 5 minutes.</p>
      </div>
    `

    await sendEmail({
      to: normalizedEmail,
      subject: 'Your Registration OTP',
      html: htmlContent,
    })
  },

  async register({
    name,
    email,
    password,
    tenantId,
    otp,
  }: RegisterInput): Promise<AuthResult> {
    const normalizedEmail = normalizeEmail(email)

    const existingUser = await AuthDAO.findByEmail(normalizedEmail)

    if (existingUser) {
      throw new ApiError({
        statusCode: 409,
        message: 'User with this email already exists',
      })
    }

    const otpKey = `otp:register:${normalizedEmail}`
    const storedOtp = await redisConnection.get(otpKey)

    if (!storedOtp || storedOtp !== otp) {
      throw new ApiError({
        statusCode: 400,
        message: 'Invalid or expired OTP',
      })
    }

    // Clear OTP after successful verification
    await redisConnection.del(otpKey)

    const user = await AuthDAO.createUser({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: password,
      tenantId: tenantId?.trim() || randomUUID(),
      role: 'owner',
    })

    const accessToken = user.generateAuthToken()
    const refreshToken = user.generateRefreshToken()

    await user.save()

    try {
      await sendEmail({
        to: user.email,
        subject: 'Welcome to SheryAssets',
        html: getWelcomeEmailContent(user.name),
      })
    } catch (error) {
      logger.error('Failed to send welcome email', {
        module: 'AUTH',
        userId: user._id.toString(),
        email: user.email,
        error,
      })
    }

    return {
      user: toPublicUser(user),
      accessToken,
      refreshToken,
    }
  },

  async login({ email, password }: LoginInput): Promise<AuthResult> {
    const normalizedEmail = normalizeEmail(email)

    const user = await AuthDAO.findByEmail(normalizedEmail, true)

    if (!user) {
      throw new ApiError({
        statusCode: 401,
        message: 'Invalid email or password',
      })
    }

    const isPasswordValid = await user.comparePassword(password)

    if (!isPasswordValid) {
      throw new ApiError({
        statusCode: 401,
        message: 'Invalid email or password',
      })
    }

    const accessToken = user.generateAuthToken()
    const refreshToken = user.generateRefreshToken()

    await user.save()

    return {
      user: toPublicUser(user),
      accessToken,
      refreshToken,
    }
  },

  async refresh(refreshToken: string): Promise<AuthResult> {
    const userId = verifyRefreshToken(refreshToken)

    const user = await AuthDAO.findByIdAndRefreshToken(userId, refreshToken)

    if (!user) {
      throw new ApiError({
        statusCode: 401,
        message: 'Refresh token is not valid anymore',
      })
    }

    const nextAccessToken = user.generateAuthToken()
    const nextRefreshToken = user.generateRefreshToken()

    await user.save()

    return {
      user: toPublicUser(user),
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken,
    }
  },

  async logout({ userId, refreshToken }: LogoutInput): Promise<void> {
    if (userId) {
      await AuthDAO.clearRefreshToken(userId)
      return
    }

    if (!refreshToken) {
      return
    }

    const parsedUserId = (() => {
      try {
        return verifyRefreshToken(refreshToken)
      } catch {
        return null
      }
    })()

    if (!parsedUserId) {
      return
    }

    const user = await AuthDAO.findByIdAndRefreshToken(parsedUserId, refreshToken)

    if (!user) {
      return
    }

    user.refreshToken = null
    await user.save()
  },

  async getCurrentUser(userId: string): Promise<PublicUser> {
    const user = await AuthDAO.findById(userId)

    if (!user) {
      throw new ApiError({
        statusCode: 404,
        message: 'User not found',
      })
    }

    return toPublicUser(user)
  },
}

export default AuthService
