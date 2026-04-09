import mongoose, { Schema } from 'mongoose'
import { type IPlan } from './plan.type'

const planSchema: Schema<IPlan> = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    priceMonthly: {
      type: Number,
      required: true,
      min: 0,
    },
    priceYearly: {
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
    features: [
      {
        text: { type: String, required: true },
        included: { type: Boolean, required: true },
      },
    ],
    variant: {
      type: { type: String, enum: ['gradient', 'default'], required: true },
      background: { type: String, required: true },
    },
    highlightText: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
)

export const Plan = mongoose.model<IPlan>('Plan', planSchema)
