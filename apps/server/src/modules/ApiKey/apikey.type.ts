import type { Document, Types } from 'mongoose'

// ─── Enums ─────────────────────────────────────────────────────────────────────

export const API_KEY_STATUSES = ['active', 'revoked'] as const
export type ApiKeyStatus = (typeof API_KEY_STATUSES)[number]

// ─── Interface ─────────────────────────────────────────────────────────────────

export interface IApiKey extends Document {
  _id: Types.ObjectId
  tenantId: Types.ObjectId
  createdBy: Types.ObjectId
  name: string
  keyHash: string
  prefix: string
  status: ApiKeyStatus
  lastUsedAt?: Date
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
}