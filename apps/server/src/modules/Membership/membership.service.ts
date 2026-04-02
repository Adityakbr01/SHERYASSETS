import { ApiError } from '@/utils/ApiError'
import MembershipDAO, { type MembershipWithTenant } from './membership.dao'
import type { IMembership, MembershipRole } from './membership.type'

const MembershipService = {
  async getUserTenants(userId: string): Promise<MembershipWithTenant[]> {
    return MembershipDAO.findAllByUser(userId)
  },

  async getTenantMembers(tenantId: string): Promise<IMembership[]> {
    return MembershipDAO.findAllByTenant(tenantId)
  },

  async validateMembership(userId: string, tenantId: string): Promise<IMembership> {
    const membership = await MembershipDAO.findByUserAndTenant(userId, tenantId)

    if (!membership) {
      throw new ApiError({
        statusCode: 403,
        message: 'User does not belong to this tenant',
      })
    }

    return membership
  },

  async updateMemberRole(
    userId: string,
    tenantId: string,
    role: MembershipRole,
  ): Promise<IMembership> {
    const membership = await MembershipDAO.updateRole(userId, tenantId, role)

    if (!membership) {
      throw new ApiError({
        statusCode: 404,
        message: 'Active membership not found',
      })
    }

    return membership
  },

  async removeMember(userId: string, tenantId: string): Promise<void> {
    const membership = await MembershipDAO.updateStatus(userId, tenantId, 'removed')

    if (!membership) {
      throw new ApiError({
        statusCode: 404,
        message: 'Membership not found',
      })
    }
  },
}

export default MembershipService
