import type { Document, Types } from 'mongoose'

// ─── Enums ─────────────────────────────────────────────────────────────────────

export const PLAN_CODES = ['free', 'starter', 'pro'] as const
export type PlanCode = (typeof PLAN_CODES)[number]

// ─── Sub-interfaces ────────────────────────────────────────────────────────────

export interface PlanLimits {
  maxImages: number
  maxBandwidthGb: number
  maxApiKeys: number
  maxTransformations: number
}

export interface PlanFeature {
  text: string
  included: boolean
}

export interface PlanVariant {
  type: 'gradient' | 'default'
  background: string
}

// ─── Main Interface ────────────────────────────────────────────────────────────

export interface IPlan extends Document {
  _id: Types.ObjectId
  code: PlanCode
  name: string
  description: string
  priceMonthly: number
  priceYearly: number
  limits: PlanLimits
  features: PlanFeature[]
  variant: PlanVariant
  highlightText?: string
  createdAt: Date
  updatedAt: Date
}
