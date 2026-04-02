import type { NextFunction, Request, Response } from 'express'
import { asyncHandler } from '@/middlewares/asyncHandler'
import { ApiError } from '@/utils/ApiError'
import { Tenant } from '@/modules/Tenant/tenant.model'
import { Plan } from '@/modules/Plan/plan.model'
import ApiKeyService from '@/modules/ApiKey/apikey.service'
import ApiKeyDAO from '@/modules/ApiKey/apikey.dao'

/**
 * Authenticate via API Key (X-API-KEY header).
 * Use for external / machine-to-machine requests.
 *
 * After this middleware:
 *   req.tenant  → ITenant
 *   req.apiKey  → IApiKey
 */
export const authenticateApiKey = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const rawKey = req.headers['x-api-key'] as string | undefined

    if (!rawKey) {
      throw new ApiError({
        statusCode: 401,
        message: 'Missing API Key',
      })
    }

    const keyDoc = await ApiKeyService.resolve(rawKey)

    if (!keyDoc) {
      throw new ApiError({
        statusCode: 401,
        message: 'Invalid API Key',
      })
    }

    // ─── Expiry check ────────────────────────────────────────────────────
    if (keyDoc.expiresAt && keyDoc.expiresAt < new Date()) {
      throw new ApiError({
        statusCode: 401,
        message: 'API Key has expired',
      })
    }

    // ─── Tenant validation ───────────────────────────────────────────────
    const tenant = await Tenant.findById(keyDoc.tenantId)

    if (!tenant || tenant.status !== 'active') {
      throw new ApiError({
        statusCode: 403,
        message: 'Tenant is inactive or not found',
      })
    }

    // ─── Mount plan for downstream limit checks ─────────────────────────
    const plan = await Plan.findById(tenant.planId)

    req.tenant = tenant
    req.apiKey = keyDoc
    if (plan) {
      req.plan = plan
    }

    // ─── Update last-used timestamp (fire and forget) ────────────────────
    ApiKeyDAO.updateLastUsed(keyDoc._id.toString())
    next()
  },
)