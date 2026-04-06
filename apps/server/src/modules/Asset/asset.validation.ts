import { z } from 'zod'
import { ASSET_STATUSES } from './assets.type'

const passthroughSchema = z.object({}).passthrough()
const optionalBodySchema = z.object({}).passthrough().optional().default({})

export const createAssetSchema = z.object({
    body: z.object({
        originalKey: z.string().trim().min(1, 'originalKey is required'),
        fileName: z.string().trim().min(1, 'fileName is required'),
        size: z.coerce.number().int().min(1, 'size must be greater than 0'),
        format: z.string().trim().min(1, 'format is required'),
        mimeType: z.string().trim().min(1).optional(),
        folder: z.string().trim().max(255, 'folder must be less than 256 chars').optional(),
        path: z.string().trim().max(255, 'path must be less than 256 chars').optional(),
        width: z.coerce.number().int().min(1).optional(),
        height: z.coerce.number().int().min(1).optional(),
        status: z.enum(ASSET_STATUSES).optional(),
        urls: z.object({
            original: z.string().trim().url().optional(),
            mobile: z.string().trim().url().optional(),
            tablet: z.string().trim().url().optional(),
            desktop: z.string().trim().url().optional(),
        }).optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
    }),
    query: passthroughSchema,
    params: passthroughSchema,
})

export const listAssetsSchema = z.object({
    body: optionalBodySchema,
    query: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(25),
    }).passthrough(),
    params: passthroughSchema,
})

export const assetIdParamSchema = z.object({
    body: optionalBodySchema,
    query: passthroughSchema,
    params: z.object({
        assetId: z.string().trim().min(1, 'assetId is required'),
    }),
})

export const updateAssetStatusSchema = z.object({
    body: z.object({
        status: z.enum(ASSET_STATUSES),
    }),
    query: passthroughSchema,
    params: z.object({
        assetId: z.string().trim().min(1, 'assetId is required'),
    }),
})