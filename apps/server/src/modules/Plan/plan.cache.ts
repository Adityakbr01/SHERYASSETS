import { redisConnection } from '@/configs/redis'
import type { IPlan } from './plan.type'

const CACHE_KEYS = {
  ALL_PLANS: 'cache:plans:all',
  PLAN_PREFIX: 'cache:plan:',
}

const CACHE_TTL = 3600 // 1 hour

const PlanCache = {
  async setAllPlans(plans: IPlan[]): Promise<void> {
    await redisConnection.setex(
      CACHE_KEYS.ALL_PLANS,
      CACHE_TTL,
      JSON.stringify(plans),
    )
  },

  async getAllPlans(): Promise<IPlan[] | null> {
    const cached = await redisConnection.get(CACHE_KEYS.ALL_PLANS)
    return cached ? JSON.parse(cached) : null
  },

  async setPlan(plan: IPlan): Promise<void> {
    // Cache by both ID and code for flexibility
    const idKey = `${CACHE_KEYS.PLAN_PREFIX}id:${plan._id}`
    const codeKey = `${CACHE_KEYS.PLAN_PREFIX}code:${plan.code}`

    const data = JSON.stringify(plan)
    await Promise.all([
      redisConnection.setex(idKey, CACHE_TTL, data),
      redisConnection.setex(codeKey, CACHE_TTL, data),
    ])
  },

  async getPlanById(id: string): Promise<IPlan | null> {
    const cached = await redisConnection.get(`${CACHE_KEYS.PLAN_PREFIX}id:${id}`)
    return cached ? JSON.parse(cached) : null
  },

  async getPlanByCode(code: string): Promise<IPlan | null> {
    const cached = await redisConnection.get(`${CACHE_KEYS.PLAN_PREFIX}code:${code}`)
    return cached ? JSON.parse(cached) : null
  },

  async invalidateAll(): Promise<void> {
    // Delete all plan related keys
    const keys = await redisConnection.keys(`${CACHE_KEYS.PLAN_PREFIX}*`)
    const allKeys = [...keys, CACHE_KEYS.ALL_PLANS]
    if (allKeys.length > 0) {
      await redisConnection.del(...allKeys)
    }
  },
}

export default PlanCache
