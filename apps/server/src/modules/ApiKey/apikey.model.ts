import mongoose, { Schema } from 'mongoose'
import { API_KEY_STATUSES, type IApiKey } from './apikey.type'

const apiKeySchema: Schema<IApiKey> = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    keyHash: {
      type: String,
      required: true,
      unique: true,
    },
    prefix: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: API_KEY_STATUSES,
      default: 'active',
    },
    lastUsedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
  },
  { timestamps: true },
)

// ─── Indexes ───────────────────────────────────────────────────────────────────
apiKeySchema.index({ prefix: 1 })
apiKeySchema.index({ tenantId: 1, status: 1 })

export const ApiKey = mongoose.model<IApiKey>('ApiKey', apiKeySchema)