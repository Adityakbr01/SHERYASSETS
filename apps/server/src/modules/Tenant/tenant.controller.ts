import type { Request, Response } from 'express'
import { asyncHandler } from '@/middlewares/asyncHandler'
import { ApiResponse } from '@/utils/ApiResponse'
import { ApiError } from '@/utils/ApiError'
import TenantService from './tenant.service'

const TenantController = {
  getMyTenants: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError({ statusCode: 401, message: 'Authentication required' })
    }

    const tenants = await TenantService.getByOwner(req.user._id.toString())

    ApiResponse.success(res, {
      message: 'Tenants fetched successfully',
      data: tenants,
    })
  }),

  getTenantBySlug: asyncHandler(async (req: Request, res: Response) => {
    const tenant = await TenantService.getBySlug(req.params.slug as string)

    ApiResponse.success(res, {
      message: 'Tenant fetched successfully',
      data: tenant,
    })
  }),
}

export default TenantController
