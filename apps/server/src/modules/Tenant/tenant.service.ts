import { ApiError } from '@/utils/ApiError'
import TenantDAO from './tenant.dao'
import type { ITenant } from './tenant.type'

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
