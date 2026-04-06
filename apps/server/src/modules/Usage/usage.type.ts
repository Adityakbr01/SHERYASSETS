import type { Document, Types } from 'mongoose'

export type CacheStatus = 'hit' | 'miss'

export type UsageIncrementInput = {
    uploadCount?: number
    transformationCount?: number
    bandwidthBytes?: number
    originFetchCount?: number
    cacheHitCount?: number
}

export interface IUsage extends Document {
    _id: Types.ObjectId
    tenantId: Types.ObjectId
    month: string
    uploadCount: number
    transformationCount: number
    bandwidthBytes: number
    originFetchCount: number
    cacheHitCount: number
    createdAt: Date
    updatedAt: Date
}
