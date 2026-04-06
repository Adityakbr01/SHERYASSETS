import mongoose, { Schema } from 'mongoose'
import type { IUsage } from './usage.type'

const usageSchema: Schema<IUsage> = new Schema(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: 'Tenant',
            required: true,
        },
        month: {
            type: String,
            required: true,
            trim: true,
        },
        uploadCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        transformationCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        bandwidthBytes: {
            type: Number,
            default: 0,
            min: 0,
        },
        originFetchCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        cacheHitCount: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    { timestamps: true },
)

usageSchema.index({ tenantId: 1, month: 1 }, { unique: true })
usageSchema.index({ tenantId: 1, updatedAt: -1 })

export const Usage = mongoose.model<IUsage>('Usage', usageSchema)
