import { ApiError } from '@/utils/ApiError'
import { logger } from '@/utils/logger'
import PlanDAO from './plan.dao'
import type { IPlan, PlanCode } from './plan.type'

// ─── Default Plan Definitions (seeded into DB, not hardcoded in logic) ─────

const DEFAULT_PLANS: Array<{
  code: PlanCode
  name: string
  priceMonthly: number
  limits: IPlan['limits']
  features: IPlan['features']
}> = [
    {
      code: 'basic',
      name: 'Basic',
      priceMonthly: 0,
      limits: {
        maxImages: 1000,
        maxBandwidthGb: 5,
        maxApiKeys: 2,
        maxTransformations: 5000,
      },
      features: {
        priorityProcessing: false,
        customDomain: false,
        eagerVariants: false,
      },
    },
    {
      code: 'pro',
      name: 'Pro',
      priceMonthly: 29,
      limits: {
        maxImages: 50000,
        maxBandwidthGb: 100,
        maxApiKeys: 10,
        maxTransformations: 100000,
      },
      features: {
        priorityProcessing: true,
        customDomain: true,
        eagerVariants: false,
      },
    },
    {
      code: 'payg',
      name: 'Pay As You Go',
      priceMonthly: 0,
      limits: {
        maxImages: -1, // unlimited (-1 = no cap, billed by usage)
        maxBandwidthGb: -1,
        maxApiKeys: 20,
        maxTransformations: -1,
      },
      features: {
        priorityProcessing: true,
        customDomain: true,
        eagerVariants: true,
      },
    },
    {
      code: 'enterprise',
      name: 'Enterprise',
      priceMonthly: 299,
      limits: {
        maxImages: -1,
        maxBandwidthGb: -1,
        maxApiKeys: 100,
        maxTransformations: -1,
      },
      features: {
        priorityProcessing: true,
        customDomain: true,
        eagerVariants: true,
      },
    },
  ]

const PlanService = {
  async getAll(): Promise<IPlan[]> {
    return PlanDAO.findAll()
  },

  async getByCode(code: PlanCode): Promise<IPlan> {
    const plan = await PlanDAO.findByCode(code)

    if (!plan) {
      throw new ApiError({ statusCode: 404, message: `Plan '${code}' not found` })
    }

    return plan
  },

  async getById(planId: string): Promise<IPlan> {
    const plan = await PlanDAO.findById(planId)

    if (!plan) {
      throw new ApiError({ statusCode: 404, message: 'Plan not found' })
    }

    return plan
  },

  /**
   * Seed default plans into the database.
   * Called during server bootstrap — upserts so it's safe to run repeatedly.
   */
  async seedDefaults(): Promise<void> {
    for (const planDef of DEFAULT_PLANS) {
      await PlanDAO.upsertByCode(planDef)
    }

    logger.info(`✅ Seeded ${DEFAULT_PLANS.length} default plans`)
  },

  /**
   * Returns the default plan assigned to new tenants on registration.
   */
  async getDefaultPlan(): Promise<IPlan> {
    return this.getByCode('basic')
  },


  async create(planData: Partial<IPlan>): Promise<IPlan> {
    const plan = await PlanDAO.create(planData)
    return plan
  },

  async update(planId: string, planData: Partial<IPlan>): Promise<IPlan> {
    const plan = await PlanDAO.update(planId, planData)
    if (!plan) {
      throw new ApiError({ statusCode: 404, message: 'Plan not found' })
    }
    return plan
  },

  async delete(planId: string): Promise<IPlan> {
    const plan = await PlanDAO.delete(planId)
    if (!plan) {
      throw new ApiError({ statusCode: 404, message: 'Plan not found' })
    }
    return plan
  },

}

export default PlanService
