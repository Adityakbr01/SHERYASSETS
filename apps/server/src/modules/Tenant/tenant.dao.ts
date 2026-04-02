import { Tenant } from './tenant.model'
import type { ITenant, TenantStatus } from './tenant.type'
import type { Types } from 'mongoose'

type CreateTenantInput = {
  name: string
  slug: string
  ownerUserId: Types.ObjectId | string
  planId: Types.ObjectId | string
  billingEmail: string
  status?: TenantStatus
}

const TenantDAO = {
  async create(payload: CreateTenantInput): Promise<ITenant> {
    return Tenant.create(payload)
  },

  async findById(tenantId: string): Promise<ITenant | null> {
    return Tenant.findById(tenantId)
  },

  async findBySlug(slug: string): Promise<ITenant | null> {
    return Tenant.findOne({ slug })
  },

  async findByOwner(ownerUserId: string): Promise<ITenant[]> {
    return Tenant.find({ ownerUserId })
  },

  async updateStatus(tenantId: string, status: TenantStatus): Promise<ITenant | null> {
    return Tenant.findByIdAndUpdate(tenantId, { status }, { returnDocument: 'after' })
  },

  async updatePlan(tenantId: string, planId: string): Promise<ITenant | null> {
    return Tenant.findByIdAndUpdate(tenantId, { planId }, { returnDocument: 'after' })
  },
}

export default TenantDAO
