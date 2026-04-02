import mongoose, { Schema } from 'mongoose'
import { type IPlan, PLAN_CODES } from './plan.type'

const planSchema: Schema<IPlan> = new Schema(
  {
    code: {
      type: String,
      enum: PLAN_CODES,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    priceMonthly: {
      type: Number,
      required: true,
      min: 0,
    },
    limits: {
      maxImages: { type: Number, required: true },
      maxBandwidthGb: { type: Number, required: true },
      maxApiKeys: { type: Number, required: true },
      maxTransformations: { type: Number, required: true },
    },
    features: {
      priorityProcessing: { type: Boolean, default: false },
      customDomain: { type: Boolean, default: false },
      eagerVariants: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
)

export const Plan = mongoose.model<IPlan>('Plan', planSchema)
