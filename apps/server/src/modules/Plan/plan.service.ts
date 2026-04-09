import { ApiError } from '@/utils/ApiError'
import { logger } from '@/utils/logger'
import PlanDAO from './plan.dao'
import PlanCache from './plan.cache'
import type { IPlan, PlanCode } from './plan.type'

// ─── Default Plan Definitions (seeded into DB, not hardcoded in logic) ─────

const DEFAULT_PLANS: Array<{
  code: PlanCode
  name: string
  description: string
  priceMonthly: number
  priceYearly: number
  limits: IPlan['limits']
  features: IPlan['features']
  variant: IPlan['variant']
  highlightText?: string
}> = [
  {
    code: 'free',
    name: 'Free',
    description: 'Perfect for individuals just getting started with basic needs.',
    priceMonthly: 0,
    priceYearly: 0,
    limits: {
      maxImages: 100,
      maxBandwidthGb: 10,
      maxApiKeys: 1,
      maxTransformations: 500,
    },
    variant: {
      type: 'default',
      background: 'linear-gradient(160deg, #ececec 0%, #e0e0e0 100%)',
    },
    highlightText: 'Minimum Requirements:',
    features: [
      { text: '1 workspace user', included: true },
      { text: '100 gross Objects', included: true },
      { text: '10GB Storage space', included: true },
      { text: 'Video / Audio Traffic', included: false },
      { text: 'Advanced AI Access', included: false },
    ],
  },
  {
    code: 'starter',
    name: 'Starter',
    description: 'Great for small teams needing more storage and traffic.',
    priceMonthly: 49,
    priceYearly: 490,
    limits: {
      maxImages: 10000,
      maxBandwidthGb: 1000,
      maxApiKeys: 10,
      maxTransformations: 100000,
    },
    variant: {
      type: 'gradient',
      background:
        'linear-gradient(145deg, #2d1b00 0%, #7d594b 30%, #ca855b 65%, #f4a261 100%)',
    },
    highlightText: 'Everything in Free, plus:',
    features: [
      { text: 'Up to 5 users', included: true },
      { text: '10,000 gross Objects', included: true },
      { text: '1TB Storage space', included: true },
      { text: '100GB Video / Audio Traffic', included: true },
      { text: 'Advanced AI Access', included: false },
    ],
  },
  {
    code: 'pro',
    name: 'Pro',
    description: 'For teams scaling fast with advanced workflows and integrations.',
    priceMonthly: 149,
    priceYearly: 1490,
    limits: {
      maxImages: 100000,
      maxBandwidthGb: 5000,
      maxApiKeys: 25,
      maxTransformations: 1000000,
    },
    variant: {
      type: 'gradient',
      background:
        'linear-gradient(145deg, #0d1b2a 0%, #1b4332 30%, #2d6a4f 60%, #52b788 100%)',
    },
    highlightText: 'Everything in Starter, plus:',
    features: [
      { text: 'Up to 25 users', included: true },
      { text: '100,000 gross Objects', included: true },
      { text: '5TB Storage space', included: true },
      { text: '500GB Video / Audio Traffic', included: true },
      { text: 'Advanced AI Access', included: true },
    ],
  },
]

const PlanService = {
  async getAll(): Promise<{ data: IPlan[]; isCache: boolean }> {
    const cached = await PlanCache.getAllPlans()
    if (cached) return { data: cached, isCache: true }

    const plans = await PlanDAO.findAll()
    await PlanCache.setAllPlans(plans)

    return { data: plans, isCache: false }
  },

  async getByCode(code: PlanCode): Promise<{ data: IPlan; isCache: boolean }> {
    const cached = await PlanCache.getPlanByCode(code)
    if (cached) return { data: cached, isCache: true }

    const plan = await PlanDAO.findByCode(code)

    if (!plan) {
      throw new ApiError({ statusCode: 404, message: `Plan '${code}' not found` })
    }

    await PlanCache.setPlan(plan)
    return { data: plan, isCache: false }
  },

  async getById(planId: string): Promise<{ data: IPlan; isCache: boolean }> {
    const cached = await PlanCache.getPlanById(planId)
    if (cached) return { data: cached, isCache: true }

    const plan = await PlanDAO.findById(planId)

    if (!plan) {
      throw new ApiError({ statusCode: 404, message: 'Plan not found' })
    }

    await PlanCache.setPlan(plan)
    return { data: plan, isCache: false }
  },

  /**
   * Seed default plans into the database.
   * Restructures the database to support only Free, Starter, and Pro.
   * Deletes all existing plans before seeding.
   */
  async seedDefaults(): Promise<void> {
    // 1. Delete all existing plans
    await PlanDAO.deleteAll()

    // 2. Seed only the three specified plans
    for (const planDef of DEFAULT_PLANS) {
      await PlanDAO.create(planDef)
    }

    await PlanCache.invalidateAll()
    logger.info(`✅ Restructured and seeded ${DEFAULT_PLANS.length} default plans`)
  },

  /**
   * Returns the default plan assigned to new tenants on registration.
   */
  async getDefaultPlan(): Promise<IPlan> {
    const { data } = await this.getByCode('free')
    return data
  },

  async create(planData: Partial<IPlan>): Promise<IPlan> {
    const plan = await PlanDAO.create(planData)
    await PlanCache.invalidateAll()
    return plan
  },

  async update(planId: string, planData: Partial<IPlan>): Promise<IPlan> {
    const plan = await PlanDAO.update(planId, planData)
    if (!plan) {
      throw new ApiError({ statusCode: 404, message: 'Plan not found' })
    }
    await PlanCache.invalidateAll()
    return plan
  },

  async delete(planId: string): Promise<IPlan> {
    const plan = await PlanDAO.delete(planId)
    if (!plan) {
      throw new ApiError({ statusCode: 404, message: 'Plan not found' })
    }
    await PlanCache.invalidateAll()
    return plan
  },
}

export default PlanService
