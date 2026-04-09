import { ApiKey } from './apikey.model'
import type { IApiKey } from './apikey.type'

type CreateApiKeyInput = {
  tenantId: string
  createdBy: string
  name: string
  keyHash: string
  prefix: string
  expiresAt?: Date
}

const ApiKeyDAO = {
  async create(payload: CreateApiKeyInput): Promise<IApiKey> {
    return ApiKey.create(payload)
  },

  async findByPrefixAndHash(prefix: string, keyHash: string): Promise<IApiKey | null> {
    return ApiKey.findOne({ prefix, keyHash, status: 'active' })
  },

  async findByTenant(
    tenantId: string,
    options?: { status?: string; search?: string; page?: number; limit?: number },
  ): Promise<{ keys: IApiKey[]; total: number }> {
    const { status, search, page = 1, limit = 10 } = options || {}

    const filter: Record<string, unknown> = { tenantId }
    if (status && status !== 'all') filter.status = status
    if (search) filter.name = { $regex: search, $options: 'i' }

    const [keys, total] = await Promise.all([
      ApiKey.find(filter)
        .select('-keyHash')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      ApiKey.countDocuments(filter),
    ])

    return { keys, total }
  },

  async countActiveByTenant(tenantId: string): Promise<number> {
    return ApiKey.countDocuments({ tenantId, status: 'active' })
  },

  async revokeById(apiKeyId: string, tenantId: string): Promise<IApiKey | null> {
    return ApiKey.findOneAndUpdate(
      { _id: apiKeyId, tenantId, status: 'active' },
      { status: 'revoked' },
      { returnDocument: 'after' },
    )
  },

  async updateLastUsed(apiKeyId: string): Promise<void> {
    // Fire-and-forget — no await needed at call site
    ApiKey.updateOne({ _id: apiKeyId }, { lastUsedAt: new Date() }).exec()
  },
}

export default ApiKeyDAO
