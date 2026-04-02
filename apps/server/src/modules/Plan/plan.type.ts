import type { Document, Types } from 'mongoose'

// ─── Enums ─────────────────────────────────────────────────────────────────────

export const PLAN_CODES = ['basic', 'pro', 'payg', 'enterprise'] as const
export type PlanCode = (typeof PLAN_CODES)[number]

// ─── Sub-interfaces ────────────────────────────────────────────────────────────

export interface PlanLimits {
  maxImages: number
  maxBandwidthGb: number
  maxApiKeys: number
  maxTransformations: number
}

export interface PlanFeatures {
  priorityProcessing: boolean
  customDomain: boolean
  eagerVariants: boolean
}

// ─── Main Interface ────────────────────────────────────────────────────────────

export interface IPlan extends Document {
  _id: Types.ObjectId
  code: PlanCode
  name: string
  priceMonthly: number
  limits: PlanLimits
  features: PlanFeatures
  createdAt: Date
  updatedAt: Date
}
