import type { Document, Types } from 'mongoose'

// ─── Enums ─────────────────────────────────────────────────────────────────────

export const MEMBERSHIP_ROLES = ['owner', 'admin', 'member'] as const
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number]

export const MEMBERSHIP_STATUSES = ['active', 'invited', 'removed'] as const
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number]

// ─── Interface ─────────────────────────────────────────────────────────────────

export interface IMembership extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  tenantId: Types.ObjectId
  role: MembershipRole
  status: MembershipStatus
  invitedBy?: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}