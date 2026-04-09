import { afterAll, beforeAll, describe, expect, it, mock } from 'bun:test'

// ─── Mock Redis before imports ────────────────────────────────────────────────
mock.module('../configs/redis', () => ({
  redisConnection: {
    setex: async () => {},
    get: async () => null,
    keys: async () => [],
    del: async () => {},
    on: () => {},
    quit: async () => {},
  },
}))

// ─── Mock Razorpay before imports ─────────────────────────────────────────────
mock.module('../services/razorpay.service', () => ({
  razorpayInstance: {
    orders: {
      create: async () => ({ id: 'order_test_123', amount: 100, currency: 'INR' }),
    },
  },
  verifyRazorpaySignature: () => true,
  verifyRazorpayWebhook: () => true,
}))

// ─── Set Env Vars before imports ──────────────────────────────────────────────
process.env.RAZORPAY_KEY_ID = 'fake_key'
process.env.RAZORPAY_KEY_SECRET = 'fake_secret'

import request from 'supertest'
import mongoose from 'mongoose'
import app from '../app'
import { env } from '../configs/ENV'
import { redisConnection } from '../configs/redis'
import PlanService from '../modules/Plan/plan.service'
import User from '../modules/User/user.model'

// ─── Test DB ────────────────────────────────────────────────────────────────────

const TEST_DB_URL = env.DB_URL.replace(/\/[^/]+$/, '/sheryassets_test_plan_restructure')

describe('Plan Endpoints Restructure', () => {
  let adminToken: string
  let userToken: string

  // ─── Setup ──────────────────────────────────────────────────────────────────

  beforeAll(async () => {
    await mongoose.connect(TEST_DB_URL)
    await mongoose.connection.db?.dropDatabase()
    await PlanService.seedDefaults()

    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin_restructure@example.com',
      passwordHash: 'Password123!',
      role: 'admin',
      isEmailVerified: true,
    })
    adminToken = adminUser.generateAuthToken()

    const regularUser = await User.create({
      name: 'Regular User',
      email: 'user_restructure@example.com',
      passwordHash: 'Password123!',
      role: 'user',
      isEmailVerified: true,
    })
    userToken = regularUser.generateAuthToken()
  })

  afterAll(async () => {
    await mongoose.connection.db?.dropDatabase()
    await mongoose.disconnect()
    // redisConnection.quit() is mocked
  })

  // ─── List Plans ─────────────────────────────────────────────────────────────

  it('GET /plans — should return exactly 3 restructured plans', async () => {
    const res = await request(app).get('/api/v1/plans')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toBeArray()
    expect(res.body.data.length).toBe(3) // Free, Starter, Pro
  })

  it('GET /plans — should include free plan with correct structure', async () => {
    const res = await request(app).get('/api/v1/plans')

    const freePlan = res.body.data.find((p: { code: string }) => p.code === 'free')

    expect(freePlan).toBeDefined()
    expect(freePlan.name).toBe('Free')
    expect(freePlan.priceMonthly).toBe(0)
    expect(freePlan.description).toBeDefined()
    expect(freePlan.variant).toBeDefined()
    expect(freePlan.variant.type).toBe('default')
  })

  it('GET /plans — should include starter plan', async () => {
    const res = await request(app).get('/api/v1/plans')

    const starterPlan = res.body.data.find((p: { code: string }) => p.code === 'starter')

    expect(starterPlan).toBeDefined()
    expect(starterPlan.name).toBe('Starter')
    expect(starterPlan.priceMonthly).toBe(49)
    expect(starterPlan.variant.type).toBe('gradient')
  })

  it('GET /plans — should include pro plan', async () => {
    const res = await request(app).get('/api/v1/plans')

    const proPlan = res.body.data.find((p: { code: string }) => p.code === 'pro')

    expect(proPlan).toBeDefined()
    expect(proPlan.name).toBe('Pro')
    expect(proPlan.priceMonthly).toBe(149)
    expect(proPlan.variant.type).toBe('gradient')
  })

  // ─── Admin CRUD Operations ──────────────────────────────────────────────────

  let createdPlanId: string

  it('POST /plans — should create a new plan when authenticated as admin', async () => {
    const newPlan = {
      code: 'custom_temp_plan',
      name: 'Temporary Plan',
      description: 'A temporary plan for testing',
      priceMonthly: 50,
      priceYearly: 500,
      limits: {
        maxImages: 2000,
        maxBandwidthGb: 10,
        maxApiKeys: 5,
        maxTransformations: 10000,
      },
      features: [{ text: 'Priority Processing', included: true }],
      variant: {
        type: 'default',
        background: '#ffffff',
      },
    }

    const res = await request(app)
      .post('/api/v1/plans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newPlan)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    createdPlanId = res.body.data._id
  })

  it('POST /plans — should enforce validation rules', async () => {
    const invalidPlan = {
      code: 'invalid_code', // not in enum if we used enum in validation, let's check
      name: 'A',
      description: '',
      priceMonthly: -10,
    }

    const res = await request(app)
      .post('/api/v1/plans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(invalidPlan)

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('DELETE /plans/:id — should delete an existing plan', async () => {
    const res = await request(app)
      .delete(`/api/v1/plans/${createdPlanId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  // ─── Role-Based Access Control ──────────────────────────────────────────────

  it('POST /plans — should deny creation for regular users', async () => {
    const res = await request(app)
      .post('/api/v1/plans')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        code: 'free',
        name: 'Hacker Plan',
        description: 'Hacker plan',
        priceMonthly: 1,
        priceYearly: 10,
        limits: {
          maxImages: 10,
          maxBandwidthGb: 1,
          maxApiKeys: 1,
          maxTransformations: 1,
        },
        features: [{ text: 'Hacking', included: true }],
        variant: { type: 'default', background: '#000000' },
      })

    expect(res.status).toBe(403)
  })
})
