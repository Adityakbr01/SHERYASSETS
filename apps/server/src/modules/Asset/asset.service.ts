import { extname } from 'node:path'
import { Readable } from 'node:stream'
import PlanService from '@/modules/Plan/plan.service'
import UsageService from '@/modules/Usage/usage.service'
import { addAssetToProcessingQueue } from '@/queues/asset.queue'
import S3Service from '@/services/s3.service'
import { ApiError } from '@/utils/ApiError'
import { v4 as uuidv4 } from 'uuid'
import type { ParsedAssetUpload } from './asset.upload'
import AssetDAO from './asset.dao'
import type { AssetStatus, IAsset } from './assets.type'

type ListAssetsResult = {
    assets: IAsset[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

type VariantKeys = {
    mobile: string
    tablet: string
    desktop: string
}

type ProcessingSuccessPayload = {
    width?: number
    height?: number
    urls: {
        original: string
        mobile?: string
        tablet?: string
        desktop?: string
    }
}

const MIME_TYPE_TO_FORMAT: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif',
    'image/gif': 'gif',
}

const normalizeFolder = (value?: string): string => {
    if (!value) return 'untitled'

    const normalized = value
        .trim()
        .replace(/\\/g, '/')
        .replace(/^\/+|\/+$/g, '')

    return normalized || 'untitled'
}

const sanitizeFileName = (value: string): string => {
    const lastPathSegment = value.replace(/\\/g, '/').split('/').pop() || 'upload.bin'

    const sanitized = lastPathSegment
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9._-]/g, '')

    return sanitized || 'upload.bin'
}

const resolveFormat = (fileName: string, mimeType: string): string => {
    const extension = extname(fileName).replace('.', '').trim().toLowerCase()

    if (extension.length > 0) {
        return extension
    }

    const mapped = MIME_TYPE_TO_FORMAT[mimeType.toLowerCase()]
    if (mapped) {
        return mapped
    }

    return 'bin'
}

const clampPaginationNumber = (value: number, min: number, max: number): number => {
    if (Number.isNaN(value)) return min
    return Math.max(min, Math.min(max, value))
}

const buildStorageKeys = (
    tenantId: string,
    folder: string,
    imageId: string,
    format: string,
): {
    originalKey: string
    variantKeys: VariantKeys
} => {
    const prefix = `${tenantId}/${folder}/${imageId}`

    return {
        originalKey: `${prefix}/original.${format}`,
        variantKeys: {
            mobile: `${prefix}/mobile.webp`,
            tablet: `${prefix}/tablet.webp`,
            desktop: `${prefix}/desktop.webp`,
        },
    }
}

const buildCdnUrls = (originalKey: string, variantKeys: VariantKeys): {
    original: string
    mobile: string
    tablet: string
    desktop: string
} => ({
    original: S3Service.buildCdnUrl(originalKey),
    mobile: S3Service.buildCdnUrl(variantKeys.mobile),
    tablet: S3Service.buildCdnUrl(variantKeys.tablet),
    desktop: S3Service.buildCdnUrl(variantKeys.desktop),
})

const AssetService = {
    async uploadFromApiKeyStream(
        tenantId: string,
        planId: string,
        payload: ParsedAssetUpload,
    ): Promise<IAsset> {
        const plan = await PlanService.getById(planId)
        const currentAssetCount = await AssetDAO.countActiveByTenant(tenantId)

        if (
            plan.data.limits.maxImages !== -1
            && currentAssetCount >= plan.data.limits.maxImages
        ) {
            throw new ApiError({
                statusCode: 403,
                message: `Image limit reached (${plan.data.limits.maxImages} assets for ${plan.data.name} plan)`,
                errorCode: 'PLAN_LIMIT_IMAGES',
            })
        }

        const imageId = uuidv4()
        const normalizedFolder = normalizeFolder(payload.folder ?? payload.path)
        const safeFileName = sanitizeFileName(payload.fileName)
        const format = resolveFormat(safeFileName, payload.mimeType)
        const { originalKey, variantKeys } = buildStorageKeys(tenantId, normalizedFolder, imageId, format)
        const urls = buildCdnUrls(originalKey, variantKeys)

        await S3Service.uploadStream({
            key: originalKey,
            stream: Readable.from(payload.fileBuffer),
            contentType: payload.mimeType,
            cacheControl: S3Service.cacheControlHeader,
        })

        const asset = await AssetDAO.create({
            tenantId,
            imageId,
            path: normalizedFolder,
            originalKey,
            fileName: safeFileName,
            size: payload.fileBuffer.byteLength,
            format,
            mimeType: payload.mimeType,
            status: 'processing',
            urls,
            metadata: {
                source: 's3',
                s3: {
                    bucket: S3Service.bucketName,
                    originalKey,
                    variantKeys,
                },
                upload: {
                    api: 'stream',
                    uploadedAt: new Date().toISOString(),
                },
                ...(payload.metadata ? { custom: payload.metadata } : {}),
            },
        })

        await UsageService.incrementUpload(tenantId, payload.fileBuffer.byteLength)

        try {
            await addAssetToProcessingQueue({
                assetId: asset._id.toString(),
                tenantId,
                originalKey,
                variantKeys,
            })
        } catch {
            await AssetDAO.markProcessingFailed(
                asset._id.toString(),
                tenantId,
                'Asset uploaded but failed to enqueue variant processing',
            )

            throw new ApiError({
                statusCode: 500,
                message: 'Asset uploaded but processing queue failed',
            })
        }

        return asset
    },

    async listByTenant(
        tenantId: string,
        pageInput: number,
        limitInput: number,
    ): Promise<ListAssetsResult> {
        const page = clampPaginationNumber(pageInput, 1, Number.MAX_SAFE_INTEGER)
        const limit = clampPaginationNumber(limitInput, 1, 100)
        const skip = (page - 1) * limit

        const [assets, total] = await Promise.all([
            AssetDAO.findByTenant(tenantId, skip, limit),
            AssetDAO.countActiveByTenant(tenantId),
        ])

        return {
            assets,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        }
    },

    async getById(assetId: string, tenantId: string): Promise<IAsset> {
        const asset = await AssetDAO.findById(assetId, tenantId)

        if (!asset) {
            throw new ApiError({ statusCode: 404, message: 'Asset not found' })
        }

        return asset
    },

    async updateStatus(assetId: string, tenantId: string, status: AssetStatus): Promise<IAsset> {
        const updatedAsset = await AssetDAO.updateStatus(assetId, tenantId, status)

        if (!updatedAsset) {
            throw new ApiError({ statusCode: 404, message: 'Asset not found' })
        }

        return updatedAsset
    },

    async remove(assetId: string, tenantId: string): Promise<IAsset> {
        const removedAsset = await AssetDAO.softDelete(assetId, tenantId)

        if (!removedAsset) {
            throw new ApiError({ statusCode: 404, message: 'Asset not found' })
        }

        return removedAsset
    },

    async markProcessingCompleted(
        assetId: string,
        tenantId: string,
        payload: ProcessingSuccessPayload,
    ): Promise<IAsset> {
        const updatedAsset = await AssetDAO.markProcessingCompleted(assetId, tenantId, payload)

        if (!updatedAsset) {
            throw new ApiError({ statusCode: 404, message: 'Asset not found for processing completion' })
        }

        return updatedAsset
    },

    async markProcessingFailed(assetId: string, tenantId: string, reason: string): Promise<void> {
        await AssetDAO.markProcessingFailed(assetId, tenantId, reason)
    },
}

export default AssetService
