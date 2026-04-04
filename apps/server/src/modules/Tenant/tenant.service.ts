import { ApiError } from '@/utils/ApiError'
import TenantDAO from './tenant.dao'
import MembershipDAO from '@/modules/Membership/membership.dao'
import type { ITenant } from './tenant.type'
import type { MembershipRole } from '@/modules/Membership/membership.type'

export type TenantWithRole = ITenant & { role: MembershipRole }

const TenantService = {
  async getById(tenantId: string): Promise<ITenant> {
    const tenant = await TenantDAO.findById(tenantId)

    if (!tenant) {
      throw new ApiError({ statusCode: 404, message: 'Tenant not found' })
    }

    return tenant
  },

  async getBySlug(slug: string): Promise<ITenant> {
    const tenant = await TenantDAO.findBySlug(slug)

    if (!tenant) {
      throw new ApiError({ statusCode: 404, message: 'Tenant not found' })
    }

    return tenant
  },

  async getByOwner(ownerUserId: string): Promise<ITenant[]> {
    return TenantDAO.findByOwner(ownerUserId)
  },

  async getAllUserTenants(userId: string): Promise<TenantWithRole[]> {
    const memberships = await MembershipDAO.findAllByUser(userId)

    const results = await Promise.all(
      memberships.map(async (m) => {
        const tenant = await TenantDAO.findById(m.tenantId._id.toString())

        if (!tenant) return null

        return { ...tenant.toObject(), role: m.role } as TenantWithRole
      }),
    )

    return results.filter((t): t is TenantWithRole => t !== null)
  },

  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 48)
  },

  async ensureUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug
    let counter = 0

    while (await TenantDAO.findBySlug(slug)) {
      counter++
      slug = `${baseSlug}-${counter}`
    }

    return slug
  },
}

export default TenantService
