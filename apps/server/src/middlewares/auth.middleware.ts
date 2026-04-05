import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

import { env } from '@/configs/ENV'
import { asyncHandler } from '@/middlewares/asyncHandler'
import { Membership } from '@/modules/Membership/membership.model'
import type { MembershipRole } from '@/modules/Membership/membership.type'
import { Tenant } from '@/modules/Tenant/tenant.model'
import User from '@/modules/User/user.model'
import { ApiError } from '@/utils/ApiError'

// ─── JWT Payload ───────────────────────────────────────────────────────────────

interface JwtPayload {
  userId: string
  email: string
  activeTenantId?: string
  iat: number
  exp: number
}

// ─── Token Extraction ──────────────────────────────────────────────────────────

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

// ─── 1. Authenticate User (JWT) ────────────────────────────────────────────────

export const authenticateUser = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const token = extractAccessToken(req)

    if (!token) {
      throw new ApiError({
        statusCode: 401,
        message: 'Unauthorized: access token missing',
      })
    }

    let decoded: string | jwt.JwtPayload;

    try {
      decoded = jwt.verify(token, env.JWT_SECRET)
    } catch {
      throw new ApiError({
        statusCode: 401,
        message: 'Unauthorized: invalid or expired access token',
      })
    }

    if (!decoded || typeof decoded !== 'object' || !('userId' in decoded)) {
      throw new ApiError({
        statusCode: 401,
        message: 'Unauthorized: invalid token payload',
      })
    }

    const payload = decoded as unknown as JwtPayload;

    if (!payload.userId) {
      throw new ApiError({
        statusCode: 401,
        message: 'Unauthorized: invalid token payload',
      })
    }

    const user = await User.findById(payload.userId).select('-passwordHash')

    if (!user) {
      throw new ApiError({
        statusCode: 401,
        message: 'Unauthorized: user not found',
      })
    }

    req.user = user

    // Mount activeTenantId from JWT to header for downstream resolveTenant
    if (payload.activeTenantId) {
      req.headers['x-tenant-id'] = payload.activeTenantId
    }

    next()
  },
)

// ─── 2. Resolve Tenant ─────────────────────────────────────────────────────────
// Extracts tenantId from JWT (via header mount) or explicit X-TENANT-ID header.
// Validates tenant exists, is active, and user has an active membership.

export const resolveTenant = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const tenantId = req.headers['x-tenant-id'] as string | undefined

    if (!tenantId) {
      throw new ApiError({
        statusCode: 400,
        message: 'Tenant context required (missing X-TENANT-ID or activeTenantId in JWT)',
      })
    }

    const tenant = await Tenant.findById(tenantId)

    if (!tenant) {
      throw new ApiError({ statusCode: 404, message: 'Tenant not found' })
    }

    if (tenant.status !== 'active') {
      throw new ApiError({ statusCode: 403, message: 'Tenant is not active' })
    }

    if (!req.user) {
      throw new ApiError({
        statusCode: 401,
        message: 'Authentication required before resolving tenant',
      })
    }

    const membership = await Membership.findOne({
      userId: req.user._id,
      tenantId: tenant._id,
      status: 'active',
    })

    if (!membership) {
      throw new ApiError({
        statusCode: 403,
        message: 'User does not belong to this tenant',
      })
    }

    req.tenant = tenant
    req.membership = membership
    next()
  },
)

// ─── 3. Role Guard ─────────────────────────────────────────────────────────────
// Role comes from Membership — NOT from User.

export const requireRole = (roles: MembershipRole[]) => asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.membership) {
      throw new ApiError({
        statusCode: 403,
        message: 'Tenant context required for role validation',
      })
    }

    if (!roles.includes(req.membership.role)) {
      throw new ApiError({
        statusCode: 403,
        message: `Forbidden: requires one of roles [${roles.join(', ')}]`,
      })
    }

    next()
  },
)

// ─── 4. System Role Guard ──────────────────────────────────────────────────────
// Role comes from User (global system roles like 'admin' or 'user').

export const requireSystemRole = (roles: string[]) => asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError({
        statusCode: 401,
        message: 'Authentication required for system role validation',
      })
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError({
        statusCode: 403,
        message: `Forbidden: requires one of system roles [${roles.join(', ')}]`,
      })
    }

    next()
  },
)