import mongoose, { type Document, Schema, type Types } from 'mongoose'

// ─── Type ──────────────────────────────────────────────────────────────────────

export interface ISubscription extends Document {
  _id: Types.ObjectId
  tenantId: Types.ObjectId
  planId: Types.ObjectId
  userId: Types.ObjectId
  razorpayOrderId?: string
  razorpayPaymentId?: string
  status: 'created' | 'active' | 'failed' | 'cancelled'
  amount: number
  startDate?: Date
  endDate?: Date
  createdAt: Date
  updatedAt: Date
}

// ─── Schema ────────────────────────────────────────────────────────────────────

const subscriptionSchema: Schema<ISubscription> = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    razorpayOrderId: {
      type: String,
      unique: true,
      sparse: true,
    },
    razorpayPaymentId: {
      type: String,
      sparse: true,
    },
    status: {
      type: String,
      enum: ['created', 'active', 'failed', 'cancelled'],
      default: 'created',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
  },
  { timestamps: true }
)

export const Subscription = mongoose.model<ISubscription>('Subscription', subscriptionSchema)
