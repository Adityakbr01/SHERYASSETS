import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import request from 'supertest'
import mongoose from 'mongoose'
import app from '../app'
import { env } from '../configs/ENV'
import { redisConnection } from '../configs/redis'
import PlanService from '../modules/Plan/plan.service'
import User from '../modules/User/user.model'

// ─── Test DB ────────────────────────────────────────────────────────────────────

const TEST_DB_URL = env.DB_URL.replace(/\/[^/]+$/, '/sheryassets_test_plan')

describe('Plan Endpoints', () => {
  let adminToken: string
  let userToken: string

  // ─── Setup ──────────────────────────────────────────────────────────────────

  beforeAll(async () => {
    await mongoose.connect(TEST_DB_URL)
    await mongoose.connection.db?.dropDatabase()
    await PlanService.seedDefaults()

    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      passwordHash: 'Password123!',
      role: 'admin',
      isEmailVerified: true
    })
    adminToken = adminUser.generateAuthToken()

    const regularUser = await User.create({
      name: 'Regular User',
      email: 'user@example.com',
      passwordHash: 'Password123!',
      role: 'user',
      isEmailVerified: true
    })
    userToken = regularUser.generateAuthToken()
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

  // ─── Admin CRUD Operations ──────────────────────────────────────────────────

  let createdPlanId: string

  it('POST /plans — should create a new plan when authenticated as admin', async () => {
    const newPlan = {
      code: 'custom_plan',
      name: 'Custom Plan',
      priceMonthly: 50,
      limits: {
        maxImages: 2000,
        maxBandwidthGb: 10,
        maxApiKeys: 5,
        maxTransformations: 10000,
      },
      features: {
        priorityProcessing: true,
        customDomain: false,
        eagerVariants: false,
      },
    }

    const res = await request(app)
      .post('/api/v1/plans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newPlan)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.name).toBe('Custom Plan')
    expect(res.body.data.priceMonthly).toBe(50)
    
    createdPlanId = res.body.data._id
  })

  it('POST /plans — should enforce validation rules', async () => {
    const invalidPlan = {
      code: '1', // too short, min 2
      name: 'A', // too short, min 2
      priceMonthly: -10, // too low, min 0
      limits: {
        maxImages: -2, // too low, min -1
        maxBandwidthGb: -1,
        maxApiKeys: -1,
        maxTransformations: -1,
      },
      features: {
        priorityProcessing: false,
        customDomain: false,
        eagerVariants: false,
      }
    }

    const res = await request(app)
      .post('/api/v1/plans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(invalidPlan)

    expect(res.status).toBe(400) // Validation error
    expect(res.body.success).toBe(false)
  })

  it('PUT /plans/:id — should update an existing plan', async () => {
    const res = await request(app)
      .put(`/api/v1/plans/${createdPlanId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Updated Custom Plan',
        priceMonthly: 75,
      })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.priceMonthly).toBe(75)
    expect(res.body.data.name).toBe('Updated Custom Plan')
  })

  it('DELETE /plans/:id — should delete an existing plan', async () => {
    const res = await request(app)
      .delete(`/api/v1/plans/${createdPlanId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('DELETE /plans/:id — should return 404 for non-existent plan', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString()
    const res = await request(app)
      .delete(`/api/v1/plans/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})

    expect(res.status).toBe(404)
  })

  // ─── Role-Based Access Control ──────────────────────────────────────────────

  it('POST /plans — should deny creation for regular users', async () => {
    const res = await request(app)
      .post('/api/v1/plans')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Hacker Plan',
        priceMonthly: 1,
        limits: { maxImages: 10, maxBandwidthGb: 1, maxApiKeys: 1, maxTransformations: 1 },
        features: { priorityProcessing: false, customDomain: false, eagerVariants: false },
      })

    expect(res.status).toBe(403)
  })

  it('PUT /plans/:id — should deny updates for regular users', async () => {
    const res = await request(app)
      .put(`/api/v1/plans/${createdPlanId || new mongoose.Types.ObjectId().toString()}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ priceMonthly: 0 })

    expect(res.status).toBe(403)
  })

  it('DELETE /plans/:id — should deny deletion for regular users', async () => {
    const res = await request(app)
      .delete(`/api/v1/plans/${createdPlanId || new mongoose.Types.ObjectId().toString()}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({})

    expect(res.status).toBe(403)
  })
})
