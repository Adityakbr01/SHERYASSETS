import { Router } from 'express'
import { authenticateUser, requireRole, resolveTenant } from '@/middlewares/auth.middleware'
import MembershipController from './membership.controller'

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

export default membershipRouter
