import jwt from 'jsonwebtoken'

import { logger } from '@/utils/logger'
import { sendAuthEmail } from '@/utils/sendAuthEmail'
import { ApiError } from '@/utils/ApiError'
import type { IUser, PublicUser } from '@/modules/User/user.type'
import { env } from '@/configs/ENV'
import { redisConnection } from '@/configs/redis'

import { checkAndSetCooldown } from '@/utils/cooldown.util'
import AuthDAO from './auth.dao'
import TenantDAO from '@/modules/Tenant/tenant.dao'
import TenantService from '@/modules/Tenant/tenant.service'
import MembershipDAO from '@/modules/Membership/membership.dao'
import PlanService from '@/modules/Plan/plan.service'

// ─── Types ─────────────────────────────────────────────────────────────────────

type RegisterInput = {
  name: string
  email: string
  password: string
  orgName?: string
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

type TenantInfo = {
  tenantId: string
  name: string
  slug: string
  role: string
  status: string
}

type AuthResult = {
  user: PublicUser
  accessToken: string
  refreshToken: string
  tenants: TenantInfo[]
}

type SwitchTenantResult = {
  accessToken: string
  tenant: TenantInfo
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const normalizeEmail = (email: string): string => email.trim().toLowerCase()

const toPublicUser = (user: IUser): PublicUser => ({
  _id: user._id.toString(),
  name: user.name,
  email: user.email,
  isEmailVerified: user.isEmailVerified,
  role: user.role,
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

  if (!decoded || typeof decoded !== 'object' || !('userId' in decoded) || typeof decoded.userId !== 'string') {
    throw new ApiError({
      statusCode: 401,
      message: 'Invalid refresh token payload',
    })
  }

  return decoded.userId as string
}

const getUserTenants = async (userId: string): Promise<TenantInfo[]> => {
  const memberships = await MembershipDAO.findAllByUser(userId)

  return memberships.map((m) => ({
    tenantId: m.tenantId._id.toString(),
    name: m.tenantId.name,
    slug: m.tenantId.slug,
    role: m.role,
    status: m.tenantId.status,
  }))
}

const getWelcomeEmailContent = (name: string): string => `
  <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
    <h2>Welcome to SheryAssets, ${name}!</h2>
    <p>Your account is ready. You can now login and start using the dashboard.</p>
    <p>Thanks,<br/>SheryAssets Team</p>
  </div>
`

const ResetPassword = (name: string, url: string, jwtToken: string): string => `
  <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
    <h2>SheryAssets Reset Password</h2>
    <p>Hi ${name},</p>
    <p>Your password reset link is: <strong>${url}/reset-password?token=${jwtToken}</strong></p>
    <p>This link is valid for 5 minutes.</p>
    <p>Thanks,<br/>SheryAssets Team</p>
  </div>
`

// ─── Service ───────────────────────────────────────────────────────────────────

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

    await checkAndSetCooldown({
      key: `cooldown:register:${normalizedEmail}`,
      ttl: 60,
      message: 'Please wait before requesting another OTP',
    })

    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    const otpKey = `otp:register:${normalizedEmail}`
    await redisConnection.set(otpKey, otp, 'EX', 300)

    const htmlContent = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
        <h2>SheryAssets Registration OTP</h2>
        <p>Your OTP for registration is: <strong>${otp}</strong></p>
        <p>This OTP is valid for 5 minutes.</p>
      </div>
    `

    await sendAuthEmail({
      to: normalizedEmail,
      subject: 'Your Registration OTP',
      html: htmlContent,
    })
  },

  /**
   * Register flow:
   * 1. Create User (no tenantId, no role)
   * 2. Create Tenant (assigned default plan)
   * 3. Create Membership (userId + tenantId, role = owner)
   * 4. Issue JWT with activeTenantId
   */
  async register({
    name,
    email,
    password,
    orgName,
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

    // ─── Verify OTP ──────────────────────────────────────────────────────
    const otpKey = `otp:register:${normalizedEmail}`
    const storedOtp = await redisConnection.get(otpKey)

    if (!storedOtp || storedOtp !== otp) {
      throw new ApiError({
        statusCode: 400,
        message: 'Invalid or expired OTP',
      })
    }

    await redisConnection.del(otpKey)

    // ─── 1. Create User ──────────────────────────────────────────────────
    const user = await AuthDAO.createUser({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: password,
    })

    // ─── 2. Create Tenant ────────────────────────────────────────────────
    const tenantName = orgName?.trim() || `${name.trim()}'s Organization`
    const baseSlug = TenantService.generateSlug(tenantName)
    const slug = await TenantService.ensureUniqueSlug(baseSlug)

    const defaultPlan = await PlanService.getDefaultPlan()

    const tenant = await TenantDAO.create({
      name: tenantName,
      slug,
      ownerUserId: user._id,
      planId: defaultPlan._id,
      billingEmail: normalizedEmail,
      status: 'active',
    })

    // ─── 3. Create Membership ────────────────────────────────────────────
    await MembershipDAO.create({
      userId: user._id,
      tenantId: tenant._id,
      role: 'owner',
      status: 'active',
    })

    // ─── 4. Issue Tokens ─────────────────────────────────────────────────
    const accessToken = user.generateAuthToken(tenant._id.toString())
    const refreshToken = user.generateRefreshToken()

    await user.save()

    // ─── Send Welcome Email (non-blocking) ───────────────────────────────
    try {
      await sendAuthEmail({
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

    const tenants = await getUserTenants(user._id.toString())

    return {
      user: toPublicUser(user),
      accessToken,
      refreshToken,
      tenants,
    }
  },

  /**
   * Login flow:
   * 1. Validate credentials
   * 2. Fetch user's tenants via Membership
   * 3. Issue JWT WITHOUT activeTenantId (client must switch)
   * 4. If user has exactly 1 tenant, auto-set it as active
   */
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

    const tenants = await getUserTenants(user._id.toString())

    // Auto-select if user belongs to exactly one tenant
    const activeTenantId = tenants.length === 1 ? tenants[0]?.tenantId : undefined

    const accessToken = user.generateAuthToken(activeTenantId)
    const refreshToken = user.generateRefreshToken()

    await user.save()

    return {
      user: toPublicUser(user),
      accessToken,
      refreshToken,
      tenants,
    }
  },

  /**
   * Switch active tenant — validates membership and issues a new JWT.
   */
  async switchTenant(userId: string, tenantId: string): Promise<SwitchTenantResult> {
    const membership = await MembershipDAO.findByUserAndTenant(userId, tenantId)

    if (!membership) {
      throw new ApiError({
        statusCode: 403,
        message: 'You do not belong to this tenant',
      })
    }

    const user = await AuthDAO.findById(userId)

    if (!user) {
      throw new ApiError({
        statusCode: 404,
        message: 'User not found',
      })
    }

    const tenant = await TenantDAO.findById(tenantId)

    if (!tenant) {
      throw new ApiError({
        statusCode: 404,
        message: 'Tenant not found',
      })
    }

    if (tenant.status !== 'active') {
      throw new ApiError({
        statusCode: 403,
        message: 'Tenant is not active',
      })
    }

    const accessToken = user.generateAuthToken(tenantId)

    return {
      accessToken,
      tenant: {
        tenantId: tenant._id.toString(),
        name: tenant.name,
        slug: tenant.slug,
        role: membership.role,
        status: tenant.status,
      },
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

    const tenants = await getUserTenants(user._id.toString())
    const activeTenantId = tenants.length === 1 ? tenants[0]?.tenantId : undefined

    const nextAccessToken = user.generateAuthToken(activeTenantId)
    const nextRefreshToken = user.generateRefreshToken()

    await user.save()

    return {
      user: toPublicUser(user),
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken,
      tenants,
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

  async getCurrentUser(userId: string): Promise<PublicUser & { tenants: TenantInfo[] }> {
    const user = await AuthDAO.findById(userId)

    if (!user) {
      throw new ApiError({
        statusCode: 404,
        message: 'User not found',
      })
    }

    const tenants = await getUserTenants(userId)

    return {
      ...toPublicUser(user),
      tenants,
    }
  },

  async forgotPassword(email: string): Promise<void> {
    const normalizedEmail = normalizeEmail(email)

    const user = await AuthDAO.findByEmail(normalizedEmail)

    if (!user) {
      throw new ApiError({
        statusCode: 404,
        message: 'User not found',
      })
    }

    await checkAndSetCooldown({
      key: `cooldown:forgot-password:${normalizedEmail}`,
      ttl: 60,
      message: 'Please wait before requesting another password reset email',
    })

    const jwtToken = jwt.sign({ userId: user._id.toString() }, env.JWT_SECRET, {
      expiresIn: '5m',
    })

    const htmlContent = ResetPassword(user.name, env.FRONTEND_URL, jwtToken)

    await sendAuthEmail({
      to: normalizedEmail,
      subject: 'Reset Password',
      html: htmlContent,
    })
  },

  async resetPassword(token: string, password: string): Promise<void> {
    const decodedToken = jwt.verify(token, env.JWT_SECRET)

    if (typeof decodedToken === 'string') {
      throw new ApiError({
        statusCode: 401,
        message: 'Invalid token payload',
      })
    }

    const user = await AuthDAO.findById(decodedToken.userId)

    if (!user) {
      throw new ApiError({
        statusCode: 404,
        message: 'User not found',
      })
    }

    user.passwordHash = password
    await user.save()
  },
}

export default AuthService
