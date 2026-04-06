import type { Document, Types } from 'mongoose'

export const ASSET_STATUSES = ['processing', 'ready', 'failed', 'deleted'] as const
export type AssetStatus = (typeof ASSET_STATUSES)[number]

export interface AssetUrls {
    original: string
    mobile?: string
    tablet?: string
    desktop?: string
}

export interface IAsset extends Document {
    _id: Types.ObjectId
    tenantId: Types.ObjectId
    imageId: string
    path: string
    originalKey: string
    fileName: string
    size: number
    format: string
    mimeType?: string
    width?: number
    height?: number
    status: AssetStatus
    urls: AssetUrls
    metadata: Record<string, unknown>
    createdAt: Date
    updatedAt: Date
}
