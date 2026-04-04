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

  inviteUser: asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant) {
      throw new ApiError({ statusCode: 400, message: 'Tenant context required' })
    }
    if (!req.user) {
      throw new ApiError({ statusCode: 401, message: 'Authentication required' })
    }

    const { email, role } = req.body

    if (!email || typeof email !== 'string') {
      throw new ApiError({ statusCode: 400, message: 'Valid email is required' })
    }

    // Owner role cannot be assigned
    const validRoles = ['admin', 'member']
    if (!role || !validRoles.includes(role)) {
      throw new ApiError({ statusCode: 400, message: 'Valid role is required' })
    }

    await MembershipService.inviteUser(
      email.toLowerCase().trim(),
      role,
      req.tenant._id.toString(),
      req.user._id.toString(),
    )

    ApiResponse.success(res, {
      message: 'Invitation email sent successfully',
      data: null,
    })
  }),

  acceptInvite: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError({ statusCode: 401, message: 'Authentication required' })
    }

    const { token } = req.body

    if (!token || typeof token !== 'string') {
      throw new ApiError({ statusCode: 400, message: 'Valid token is required' })
    }

    const membership = await MembershipService.acceptInvite(token, req.user._id.toString())

    ApiResponse.success(res, {
      message: 'Invitation accepted successfully',
      data: membership,
    })
  }),

  removeMember: asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant) {
      throw new ApiError({ statusCode: 400, message: 'Tenant context required' })
    }

    const { userId } = req.body

    if (!userId || typeof userId !== 'string') {
      throw new ApiError({ statusCode: 400, message: 'User ID is required' })
    }

    await MembershipService.removeMember(userId, req.tenant._id.toString())

    ApiResponse.success(res, {
      message: 'Member removed successfully',
      data: null,
    })
  }),
}

export default MembershipController
