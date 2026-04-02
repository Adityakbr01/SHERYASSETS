import type { Request, Response } from 'express'
import { asyncHandler } from '@/middlewares/asyncHandler'
import { ApiResponse } from '@/utils/ApiResponse'
import { ApiError } from '@/utils/ApiError'
import ApiKeyService from './apikey.service'

const ApiKeyController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant) {
      throw new ApiError({ statusCode: 400, message: 'Tenant context required' })
    }

    const { name } = req.body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new ApiError({ statusCode: 400, message: 'API key name is required' })
    }

    if (!req.user) {
      throw new ApiError({ statusCode: 401, message: 'Authentication required' })
    }

    const result = await ApiKeyService.generate(
      req.tenant,
      req.user._id.toString(),
      name.trim(),
    )

    ApiResponse.success(res, {
      statusCode: 201,
      message: 'API key generated. Save this key — it will not be shown again.',
      data: result,
    })
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant) {
      throw new ApiError({ statusCode: 400, message: 'Tenant context required' })
    }

    const keys = await ApiKeyService.listByTenant(req.tenant._id.toString())

    ApiResponse.success(res, {
      message: 'API keys fetched successfully',
      data: keys,
    })
  }),

  revoke: asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant) {
      throw new ApiError({ statusCode: 400, message: 'Tenant context required' })
    }

    const { keyId } = req.params

    if (!keyId) {
      throw new ApiError({ statusCode: 400, message: 'API key ID is required' })
    }

    const revoked = await ApiKeyService.revoke(keyId as string, req.tenant._id.toString())

    ApiResponse.success(res, {
      message: 'API key revoked successfully',
      data: { id: revoked._id, status: revoked.status },
    })
  }),
}

export default ApiKeyController