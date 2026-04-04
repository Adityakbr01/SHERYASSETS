import type { Request, Response } from 'express'
import { asyncHandler } from '@/middlewares/asyncHandler'
import { ApiResponse } from '@/utils/ApiResponse'
import { ApiError } from '@/utils/ApiError'
import TenantService from './tenant.service'
import MembershipDAO from '../Membership/membership.dao'

const TenantController = {
  getMyTenants: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError({ statusCode: 401, message: 'Authentication required' })
    }

    const tenants = await TenantService.getAllUserTenants(req.user._id.toString())

    ApiResponse.success(res, {
      message: 'Tenants fetched successfully',
      data: tenants,
    })
  }),

  // tenant.controller.ts
  getTenantBySlug: asyncHandler(async (req: Request, res: Response) => {
    const tenant = await TenantService.getBySlug(req.params.slug as string)

    let role = null
    if (req.user) {
      const membership = await MembershipDAO.findByUserAndTenant(
        req.user._id.toString(),
        tenant._id.toString(),
      )
      role = membership?.role ?? null
    }

    ApiResponse.success(res, {
      message: 'Tenant fetched successfully',
      data: { ...tenant.toObject(), role },
    })
  }),

}

export default TenantController
