import { Asset } from './asset.model'
import type { AssetStatus, IAsset } from './assets.type'

type CreateAssetInput = {
    tenantId: string
    imageId: string
    path?: string
    originalKey: string
    fileName: string
    size: number
    format: string
    mimeType?: string
    width?: number
    height?: number
    status?: AssetStatus
    urls: {
        original: string
        mobile?: string
        tablet?: string
        desktop?: string
    }
    metadata?: Record<string, unknown>
}

const AssetDAO = {
    async create(payload: CreateAssetInput): Promise<IAsset> {
        return Asset.create(payload)
    },

    async findById(assetId: string, tenantId: string): Promise<IAsset | null> {
        return Asset.findOne({
            _id: assetId,
            tenantId,
            status: { $ne: 'deleted' },
        })
    },

    async findByTenant(tenantId: string, skip: number, limit: number): Promise<IAsset[]> {
        return Asset.find({
            tenantId,
            status: { $ne: 'deleted' },
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
    },

    async countActiveByTenant(tenantId: string): Promise<number> {
        return Asset.countDocuments({
            tenantId,
            status: { $ne: 'deleted' },
        })
    },

    async updateStatus(
        assetId: string,
        tenantId: string,
        status: AssetStatus,
    ): Promise<IAsset | null> {
        return Asset.findOneAndUpdate(
            {
                _id: assetId,
                tenantId,
                status: { $ne: 'deleted' },
            },
            { status },
            { returnDocument: 'after' },
        )
    },

    async softDelete(assetId: string, tenantId: string): Promise<IAsset | null> {
        return Asset.findOneAndUpdate(
            {
                _id: assetId,
                tenantId,
                status: { $ne: 'deleted' },
            },
            { status: 'deleted' },
            { returnDocument: 'after' },
        )
    },

    async markProcessingCompleted(
        assetId: string,
        tenantId: string,
        payload: {
            width?: number
            height?: number
            urls: {
                original: string
                mobile?: string
                tablet?: string
                desktop?: string
            }
        },
    ): Promise<IAsset | null> {
        const setData: Record<string, unknown> = {
            status: 'ready',
            urls: payload.urls,
            'metadata.processedAt': new Date(),
        }

        if (payload.width) {
            setData.width = payload.width
        }

        if (payload.height) {
            setData.height = payload.height
        }

        return Asset.findOneAndUpdate(
            {
                _id: assetId,
                tenantId,
                status: { $ne: 'deleted' },
            },
            {
                $set: setData,
                $unset: { 'metadata.processingError': 1 },
            },
            { returnDocument: 'after' },
        )
    },

    async markProcessingFailed(
        assetId: string,
        tenantId: string,
        errorMessage: string,
    ): Promise<IAsset | null> {
        return Asset.findOneAndUpdate(
            {
                _id: assetId,
                tenantId,
                status: { $ne: 'deleted' },
            },
            {
                $set: {
                    status: 'failed',
                    'metadata.processingError': errorMessage,
                },
            },
            { returnDocument: 'after' },
        )
    },
}

export default AssetDAO
