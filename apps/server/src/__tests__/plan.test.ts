import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import request from 'supertest'
import mongoose from 'mongoose'
import app from '../app'
import { env } from '../configs/ENV'
import { redisConnection } from '../configs/redis'
import PlanService from '../modules/Plan/plan.service'

// ─── Test DB ────────────────────────────────────────────────────────────────────

const TEST_DB_URL = env.DB_URL.replace(/\/[^/]+$/, '/sheryassets_test_plan')

describe('Plan Endpoints', () => {
  // ─── Setup ──────────────────────────────────────────────────────────────────

  beforeAll(async () => {
    await mongoose.connect(TEST_DB_URL)
    await mongoose.connection.db?.dropDatabase()
    await PlanService.seedDefaults()
  })

  afterAll(async () => {
    await mongoose.connection.db?.dropDatabase()
    await mongoose.disconnect()
    await redisConnection.quit()
  })

  // ─── List Plans ─────────────────────────────────────────────────────────────

  it('GET /plans — should return all seeded plans', async () => {
    const res = await request(app).get('/api/v1/plans')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toBeArray()
    expect(res.body.data.length).toBe(4) // basic, pro, payg, enterprise
  })

  it('GET /plans — should include basic plan with correct structure', async () => {
    const res = await request(app).get('/api/v1/plans')

    const basicPlan = res.body.data.find(
      (p: { code: string }) => p.code === 'basic',
    )

    expect(basicPlan).toBeDefined()
    expect(basicPlan.name).toBe('Basic')
    expect(basicPlan.priceMonthly).toBe(0)
    expect(basicPlan.limits).toBeDefined()
    expect(basicPlan.limits.maxImages).toBe(1000)
    expect(basicPlan.limits.maxBandwidthGb).toBe(5)
    expect(basicPlan.limits.maxApiKeys).toBe(2)
    expect(basicPlan.limits.maxTransformations).toBe(5000)
    expect(basicPlan.features).toBeDefined()
    expect(basicPlan.features.priorityProcessing).toBe(false)
    expect(basicPlan.features.customDomain).toBe(false)
  })

  it('GET /plans — should include pro plan', async () => {
    const res = await request(app).get('/api/v1/plans')

    const proPlan = res.body.data.find(
      (p: { code: string }) => p.code === 'pro',
    )

    expect(proPlan).toBeDefined()
    expect(proPlan.name).toBe('Pro')
    expect(proPlan.priceMonthly).toBe(29)
    expect(proPlan.features.priorityProcessing).toBe(true)
    expect(proPlan.features.customDomain).toBe(true)
  })

  it('GET /plans — should include enterprise plan', async () => {
    const res = await request(app).get('/api/v1/plans')

    const enterprisePlan = res.body.data.find(
      (p: { code: string }) => p.code === 'enterprise',
    )

    expect(enterprisePlan).toBeDefined()
    expect(enterprisePlan.name).toBe('Enterprise')
    expect(enterprisePlan.priceMonthly).toBe(299)
    expect(enterprisePlan.limits.maxImages).toBe(-1) // unlimited
    expect(enterprisePlan.limits.maxBandwidthGb).toBe(-1)
    expect(enterprisePlan.features.eagerVariants).toBe(true)
  })

  it('GET /plans — should include payg plan', async () => {
    const res = await request(app).get('/api/v1/plans')

    const paygPlan = res.body.data.find(
      (p: { code: string }) => p.code === 'payg',
    )

    expect(paygPlan).toBeDefined()
    expect(paygPlan.name).toBe('Pay As You Go')
    expect(paygPlan.priceMonthly).toBe(0)
    expect(paygPlan.limits.maxImages).toBe(-1)
  })

  it('GET /plans — plans should be sorted by priceMonthly ascending', async () => {
    const res = await request(app).get('/api/v1/plans')

    const prices: number[] = res.body.data.map(
      (p: { priceMonthly: number }) => p.priceMonthly,
    )

    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]!).toBeGreaterThanOrEqual(prices[i - 1]!)
    }
  })

  // ─── Public Access ──────────────────────────────────────────────────────────

  it('GET /plans — should be accessible without authentication', async () => {
    // Plans endpoint is public — no Bearer token required
    const res = await request(app).get('/api/v1/plans')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })
})
