import type { Document, Types } from 'mongoose'

// ─── Enums ─────────────────────────────────────────────────────────────────────

export const TENANT_STATUSES = ['active', 'suspended', 'trialing', 'cancelled'] as const
export type TenantStatus = (typeof TENANT_STATUSES)[number]

// ─── Interface ─────────────────────────────────────────────────────────────────

export interface ITenant extends Document {
  _id: Types.ObjectId
  name: string
  slug: string
  ownerUserId: Types.ObjectId
  planId: Types.ObjectId
  status: TenantStatus
  billingEmail: string
  razorpayCustomerId?: string
  razorpaySubscriptionId?: string
  subscriptionStatus?: string
  createdAt: Date
  updatedAt: Date
}
