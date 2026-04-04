import { Router } from 'express'
import { authenticateUser, requireRole, resolveTenant } from '@/middlewares/auth.middleware'
import MembershipController from './membership.controller'
import { validate } from '@/middlewares/validate.middleware'
import { acceptInviteSchema, inviteSchema, removeMemberSchema } from './membership.validation'

const membershipRouter = Router()

// User's own memberships (all tenants they belong to)
membershipRouter.get('/mine', authenticateUser, MembershipController.getMyMemberships)

// List members of the active tenant (requires owner/admin)
membershipRouter.get(
  '/tenant-members',
  authenticateUser,
  resolveTenant,
  requireRole(['owner', 'admin']),
  MembershipController.getTenantMembers,
)

// Invite user to tenant
membershipRouter.post(
  '/invite',
  authenticateUser,
  validate(inviteSchema),
  resolveTenant,
  requireRole(['owner', 'admin']),
  MembershipController.inviteUser,
)

// Accept invite
membershipRouter.post(
  '/accept-invite',
  authenticateUser,
  validate(acceptInviteSchema),
  MembershipController.acceptInvite,
)

// Remove member
membershipRouter.post(
  '/remove-member',
  authenticateUser,
  validate(removeMemberSchema),
  resolveTenant,
  requireRole(['owner', 'admin']),
  MembershipController.removeMember,
)

export default membershipRouter
