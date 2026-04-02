import { Membership } from './membership.model'
import type { IMembership, MembershipRole, MembershipStatus } from './membership.type'
import type { Types } from 'mongoose'

type CreateMembershipInput = {
  userId: Types.ObjectId | string
  tenantId: Types.ObjectId | string
  role: MembershipRole
  status?: MembershipStatus
  invitedBy?: Types.ObjectId | string
}

export type MembershipWithTenant = IMembership & {
  tenantId: {
    _id: Types.ObjectId
    name: string
    slug: string
    status: string
  }
}

const MembershipDAO = {
  async create(payload: CreateMembershipInput): Promise<IMembership> {
    return Membership.create(payload)
  },

  async findByUserAndTenant(
    userId: string,
    tenantId: string,
    activeOnly = true,
  ): Promise<IMembership | null> {
    const filter: Record<string, unknown> = { userId, tenantId }

    if (activeOnly) {
      filter.status = 'active'
    }

    return Membership.findOne(filter)
  },

  async findAllByUser(userId: string, activeOnly = true): Promise<MembershipWithTenant[]> {
    const filter: Record<string, unknown> = { userId }

    if (activeOnly) {
      filter.status = 'active'
    }

    return Membership.find(filter).populate({
      path: 'tenantId',
      select: 'name slug status',
    }) as unknown as MembershipWithTenant[]
  },

  async findAllByTenant(tenantId: string, activeOnly = true): Promise<IMembership[]> {
    const filter: Record<string, unknown> = { tenantId }

    if (activeOnly) {
      filter.status = 'active'
    }

    return Membership.find(filter).populate({
      path: 'userId',
      select: 'name email',
    })
  },

  async updateRole(
    userId: string,
    tenantId: string,
    role: MembershipRole,
  ): Promise<IMembership | null> {
    return Membership.findOneAndUpdate(
      { userId, tenantId, status: 'active' },
      { role },
      { returnDocument: 'after' },
    )
  },

  async updateStatus(
    userId: string,
    tenantId: string,
    status: MembershipStatus,
  ): Promise<IMembership | null> {
    return Membership.findOneAndUpdate(
      { userId, tenantId },
      { status },
      { returnDocument: 'after' },
    )
  },

  async countByTenant(tenantId: string): Promise<number> {
    return Membership.countDocuments({ tenantId, status: 'active' })
  },
}

export default MembershipDAO
