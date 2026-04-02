import type { Request, Response } from 'express'
import { asyncHandler } from '@/middlewares/asyncHandler'
import { ApiResponse } from '@/utils/ApiResponse'
import { ApiError } from '@/utils/ApiError'
import MembershipService from './membership.service'

const MembershipController = {
  getMyMemberships: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError({ statusCode: 401, message: 'Authentication required' })
    }

    const memberships = await MembershipService.getUserTenants(req.user._id.toString())

    ApiResponse.success(res, {
      message: 'Memberships fetched successfully',
      data: memberships,
    })
  }),

  getTenantMembers: asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant) {
      throw new ApiError({ statusCode: 400, message: 'Tenant context required' })
    }

    const members = await MembershipService.getTenantMembers(
      req.tenant._id.toString(),
    )

    ApiResponse.success(res, {
      message: 'Members fetched successfully',
      data: members,
    })
  }),
}

export default MembershipController
