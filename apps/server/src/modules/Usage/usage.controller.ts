import { asyncHandler } from '@/middlewares/asyncHandler'
import { ApiError } from '@/utils/ApiError'
import { ApiResponse } from '@/utils/ApiResponse'
import type { Request, Response } from 'express'
import UsageService from './usage.service'
import type { CacheStatus } from './usage.type'

const UsageController = {
    trackUpload: asyncHandler(async (req: Request, res: Response) => {
        if (!req.tenant) {
            throw new ApiError({ statusCode: 400, message: 'Tenant context required' })
        }

        const { sizeBytes, month } = req.body as { sizeBytes: number; month?: string }

        const usage = await UsageService.incrementUpload(req.tenant._id.toString(), sizeBytes, month)

        ApiResponse.success(res, {
            message: 'Upload usage tracked successfully',
            data: usage,
        })
    }),

    trackDelivery: asyncHandler(async (req: Request, res: Response) => {
        if (!req.tenant) {
            throw new ApiError({ statusCode: 400, message: 'Tenant context required' })
        }

        const {
            bandwidthBytes,
            cacheStatus = 'miss',
            transformationCount = 0,
            month,
        } = req.body as {
            bandwidthBytes: number
            cacheStatus?: CacheStatus
            transformationCount?: number
            month?: string
        }

        const usage = await UsageService.incrementDelivery(
            req.tenant._id.toString(),
            bandwidthBytes,
            cacheStatus,
            transformationCount,
            month,
        )

        ApiResponse.success(res, {
            message: 'Delivery usage tracked successfully',
            data: usage,
        })
    }),

    getMonthlySummary: asyncHandler(async (req: Request, res: Response) => {
        if (!req.tenant) {
            throw new ApiError({ statusCode: 400, message: 'Tenant context required' })
        }

        const month = req.query.month as string | undefined
        const summary = await UsageService.getMonthlySummary(
            req.tenant._id.toString(),
            req.tenant.planId.toString(),
            month,
        )

        ApiResponse.success(res, {
            message: 'Monthly usage summary fetched successfully',
            data: summary,
        })
    }),

    getHistory: asyncHandler(async (req: Request, res: Response) => {
        if (!req.tenant) {
            throw new ApiError({ statusCode: 400, message: 'Tenant context required' })
        }

        const limit = Number(req.query.limit ?? 6)
        const history = await UsageService.getHistory(req.tenant._id.toString(), limit)

        ApiResponse.success(res, {
            message: 'Usage history fetched successfully',
            data: history,
        })
    }),

    getTotals: asyncHandler(async (req: Request, res: Response) => {
        if (!req.tenant) {
            throw new ApiError({ statusCode: 400, message: 'Tenant context required' })
        }

        const totals = await UsageService.getTotals(req.tenant._id.toString())

        ApiResponse.success(res, {
            message: 'Usage totals fetched successfully',
            data: totals,
        })
    }),
}

export default UsageController
