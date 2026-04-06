import { asyncHandler } from '@/middlewares/asyncHandler'
import { ApiError } from '@/utils/ApiError'
import { ApiResponse } from '@/utils/ApiResponse'
import type { Request, Response } from 'express'
import { parseAssetUploadRequest } from './asset.upload'
import AssetService from './asset.service'

const AssetController = {
    createFromApiKey: asyncHandler(async (req: Request, res: Response) => {
        if (!req.tenant) {
            throw new ApiError({ statusCode: 400, message: 'Tenant context required' })
        }

        const uploadPayload = await parseAssetUploadRequest(req)

        const asset = await AssetService.uploadFromApiKeyStream(
            req.tenant._id.toString(),
            req.tenant.planId.toString(),
            uploadPayload,
        )

        ApiResponse.success(res, {
            statusCode: 201,
            message: 'Asset uploaded successfully',
            data: {
                ...asset.toObject(),
                cdn: asset.urls,
            },
        })
    }),

    listByTenant: asyncHandler(async (req: Request, res: Response) => {
        if (!req.tenant) {
            throw new ApiError({ statusCode: 400, message: 'Tenant context required' })
        }

        const page = Number(req.query.page ?? 1)
        const limit = Number(req.query.limit ?? 25)

        const result = await AssetService.listByTenant(req.tenant._id.toString(), page, limit)

        ApiResponse.success(res, {
            message: 'Assets fetched successfully',
            data: result.assets,
            meta: result.pagination,
        })
    }),

    getById: asyncHandler(async (req: Request, res: Response) => {
        if (!req.tenant) {
            throw new ApiError({ statusCode: 400, message: 'Tenant context required' })
        }

        const assetId = req.params.assetId as string
        const asset = await AssetService.getById(assetId, req.tenant._id.toString())

        ApiResponse.success(res, {
            message: 'Asset fetched successfully',
            data: asset,
        })
    }),

    updateStatus: asyncHandler(async (req: Request, res: Response) => {
        if (!req.tenant) {
            throw new ApiError({ statusCode: 400, message: 'Tenant context required' })
        }

        const assetId = req.params.assetId as string
        const { status } = req.body as { status: 'processing' | 'ready' | 'failed' | 'deleted' }

        const asset = await AssetService.updateStatus(
            assetId,
            req.tenant._id.toString(),
            status,
        )

        ApiResponse.success(res, {
            message: 'Asset status updated successfully',
            data: asset,
        })
    }),

    remove: asyncHandler(async (req: Request, res: Response) => {
        if (!req.tenant) {
            throw new ApiError({ statusCode: 400, message: 'Tenant context required' })
        }

        const assetId = req.params.assetId as string
        const asset = await AssetService.remove(assetId, req.tenant._id.toString())

        ApiResponse.success(res, {
            message: 'Asset deleted successfully',
            data: asset,
        })
    }),
}

export default AssetController
