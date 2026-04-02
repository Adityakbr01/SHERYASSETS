import mongoose, { Schema } from 'mongoose'
import { type IMembership, MEMBERSHIP_ROLES, MEMBERSHIP_STATUSES } from './membership.type'

const membershipSchema: Schema<IMembership> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    role: {
      type: String,
      enum: MEMBERSHIP_ROLES,
      required: true,
    },
    status: {
      type: String,
      enum: MEMBERSHIP_STATUSES,
      default: 'active',
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true },
)

// ─── Crucial Indexes ───────────────────────────────────────────────────────────
// Prevent duplicate membership per user+tenant pair
membershipSchema.index({ userId: 1, tenantId: 1 }, { unique: true })
// Fast tenant member listing
membershipSchema.index({ tenantId: 1, status: 1 })
// Fast user tenant listing
membershipSchema.index({ userId: 1, status: 1 })

export const Membership = mongoose.model<IMembership>('Membership', membershipSchema)
