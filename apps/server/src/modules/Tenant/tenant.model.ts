import mongoose, { Schema } from 'mongoose'
import { type ITenant, TENANT_STATUSES } from './tenant.type'

const tenantSchema: Schema<ITenant> = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },
    ownerUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: true,
    },
    status: {
      type: String,
      enum: TENANT_STATUSES,
      default: 'active',
    },
    billingEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    razorpayCustomerId: {
      type: String,
    },
    razorpaySubscriptionId: {
      type: String,
    },
    subscriptionStatus: {
      type: String,
    },
  },
  { timestamps: true },
)

// ─── Indexes ───────────────────────────────────────────────────────────────────
tenantSchema.index({ ownerUserId: 1 })

export const Tenant = mongoose.model<ITenant>('Tenant', tenantSchema)
