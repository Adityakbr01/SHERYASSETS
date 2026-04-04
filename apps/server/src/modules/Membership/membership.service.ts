import { env } from '@/configs/ENV'
import { redisConnection } from '@/configs/redis'
import TenantDAO from '@/modules/Tenant/tenant.dao'
import UserDAO from '@/modules/User/user.dao'
import { addMembershipInviteToQueue } from '@/queues/membership.queue'
import { ApiError } from '@/utils/ApiError'
import jwt from 'jsonwebtoken'
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
    const existingMembership = await MembershipDAO.findByUserAndTenant(userId, tenantId)

    if (!existingMembership) {
      throw new ApiError({
        statusCode: 404,
        message: 'Active membership not found for this user in this tenant',
      })
    }

    if (existingMembership.role === 'owner') {
      throw new ApiError({
        statusCode: 400,
        message: 'Cannot remove the owner of the tenant',
      })
    }

    await MembershipDAO.updateStatus(userId, tenantId, 'removed')
  },

  async inviteUser(
    email: string,
    role: MembershipRole,
    tenantId: string,
    inviterId: string,
  ): Promise<void> {
    const inviterCooldownKey = `cooldown:invite:${inviterId}`
    const hasCooldown = await redisConnection.get(inviterCooldownKey)

    if (hasCooldown) {
      throw new ApiError({
        statusCode: 429,
        message: 'You are sending invitations too fast. Please wait a moment.',
      })
    }

    const tenant = await TenantDAO.findById(tenantId)
    if (!tenant) {
      throw new ApiError({ statusCode: 404, message: 'Tenant not found' })
    }

    const inviteKey = `invite:${tenantId}:${email}`
    const isInvited = await redisConnection.get(inviteKey)

    if (isInvited) {
      throw new ApiError({
        statusCode: 429,
        message: 'User already invited. Please wait for acceptance.',
      })
    }

    // Check if the targeted user already exists and has joined
    const targetUser = await UserDAO.findByEmail(email)
    if (targetUser) {
      const existingMembership = await MembershipDAO.findByUserAndTenant(
        targetUser._id.toString(),
        tenantId,
      )

      if (existingMembership) {
        if (existingMembership.role === 'owner') {
          throw new ApiError({
            statusCode: 400,
            message: 'User is the owner of this tenant and has already joined',
          })
        }
        throw new ApiError({
          statusCode: 400,
          message: 'User has already joined this tenant',
        })
      }
    }

    // 1. Create a stateless JWT invite token (expires in 7 days)
    const token = jwt.sign(
      { email, role, tenantId, inviterId },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    // 2. Generate invite link (e.g. frontend.com/join?token=XYZ)
    const inviteLink = `${env.FRONTEND_URL}/join?token=${token}`

    // 3. Queue the email job with low priority
    await addMembershipInviteToQueue({
      email,
      tenantName: tenant.name,
      role,
      inviteLink,
    })

    // 4. Set redis cooldown for 1 day avoiding duplicate invites for same user
    await redisConnection.set(inviteKey, '1', 'EX', 86400)

    // 5. Anti-spam cooldown (10 seconds) for the inviter
    await redisConnection.set(inviterCooldownKey, '1', 'EX', 10)
  },

  async acceptInvite(token: string, userId: string): Promise<IMembership> {
    // 1. Verify the JWT token
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      email: string
      role: MembershipRole
      tenantId: string
      inviterId: string
    }

    const { email, role, tenantId } = decoded

    const user = await UserDAO.findById(userId)
    if (!user) {
      throw new ApiError({
        statusCode: 404,
        message: 'User account not found',
      })
    }

    if (user.email !== email) {
      throw new ApiError({
        statusCode: 403,
        message: 'This invitation was sent to a different email address. Please create an account with the invited email or login with the correct account first, then try again.',
      })
    }

    // 2. Check if user already has an active membership in this tenant
    const existingMembership = await MembershipDAO.findByUserAndTenant(userId, tenantId)
    if (existingMembership) {
      throw new ApiError({
        statusCode: 400,
        message: 'You are already a member of this tenant',
      })
    }

    // 3. Create the membership (status: 'active' by default)
    const membership = await MembershipDAO.create({
      userId,
      tenantId,
      role,
      status: 'active',
      invitedBy: decoded.inviterId,
    })

    // 4. Remove the invite cooldown from redis
    const inviteKey = `invite:${tenantId}:${email}`
    await redisConnection.del(inviteKey)

    return membership
  },

}

export default MembershipService
