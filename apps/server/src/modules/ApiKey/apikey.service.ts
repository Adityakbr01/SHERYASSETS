import crypto from 'crypto'
import { ApiError } from '@/utils/ApiError'
import ApiKeyDAO from './apikey.dao'
import PlanService from '@/modules/Plan/plan.service'
import type { ITenant } from '@/modules/Tenant/tenant.type'
import type { IApiKey } from './apikey.type'

const API_KEY_PREFIX = 'shry'

type GenerateResult = {
  id: string
  name: string
  apiKey: string // ← shown only once
  prefix: string
  createdAt: Date
}

const ApiKeyService = {
  /**
   * Generate a new API key for a tenant.
   * The raw key is returned ONLY in this response — it is never stored.
   */
  async generate(
    tenant: ITenant,
    createdBy: string,
    name: string,
  ): Promise<GenerateResult> {
    // ─── Enforce plan limit ──────────────────────────────────────────────
    const plan = await PlanService.getById(tenant.planId.toString())
    const activeCount = await ApiKeyDAO.countActiveByTenant(tenant._id.toString())

    if (plan.data.limits.maxApiKeys !== -1 && activeCount >= plan.data.limits.maxApiKeys) {
      throw new ApiError({
        statusCode: 403,
        message: `API key limit reached (${plan.data.limits.maxApiKeys} keys for ${plan.data.name} plan)`,
        errorCode: 'PLAN_LIMIT_API_KEYS',
      })
    }

    // ─── Generate cryptographically secure key ───────────────────────────
    const rawToken = crypto.randomBytes(32).toString('base64url')
    const fullKey = `${API_KEY_PREFIX}_${rawToken}`
    const keyHash = crypto.createHash('sha256').update(fullKey).digest('hex')

    const apiKey = await ApiKeyDAO.create({
      tenantId: tenant._id.toString(),
      createdBy,
      name,
      keyHash,
      prefix: API_KEY_PREFIX,
    })

    return {
      id: apiKey._id.toString(),
      name: apiKey.name,
      apiKey: fullKey,
      prefix: API_KEY_PREFIX,
      createdAt: apiKey.createdAt,
    }
  },

  /**
   * List all API keys for a tenant (hashes excluded).
   */
  async listByTenant(
    tenantId: string,
    options?: { status?: string; search?: string; page?: number; limit?: number },
  ): Promise<{ keys: IApiKey[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = options?.page || 1
    const limit = options?.limit || 10
    const { keys, total } = await ApiKeyDAO.findByTenant(tenantId, options)
    return {
      keys,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  },

  /**
   * Revoke an API key.
   */
  async revoke(apiKeyId: string, tenantId: string): Promise<IApiKey> {
    const revoked = await ApiKeyDAO.revokeById(apiKeyId, tenantId)

    if (!revoked) {
      throw new ApiError({
        statusCode: 404,
        message: 'API key not found or already revoked',
      })
    }

    return revoked
  },

  /**
   * Resolve a raw API key string to its document.
   * Used by the authenticateApiKey middleware.
   */
  async resolve(rawKey: string): Promise<IApiKey | null> {
    const parts = rawKey.split('_')

    if (parts.length < 2) return null

    const prefix = parts[0]

    if (!prefix) return null

    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')

    return ApiKeyDAO.findByPrefixAndHash(prefix, keyHash)
  },
}

export default ApiKeyService