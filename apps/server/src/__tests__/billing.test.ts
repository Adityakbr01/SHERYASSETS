import { afterAll, beforeAll, describe, expect, it, spyOn } from 'bun:test'
import request from 'supertest'
import mongoose from 'mongoose'
import app from '../app'
import { env } from '../configs/ENV'
import { redisConnection } from '../configs/redis'
import User from '../modules/User/user.model'
import { Tenant } from '../modules/Tenant/tenant.model'
import { Membership } from '../modules/Membership/membership.model'
import PlanService from '../modules/Plan/plan.service'
import { Subscription } from '../modules/Billing/subscription.model'
import { razorpayInstance } from '../services/razorpay.service'
import crypto from 'crypto'

const TEST_DB_URL = env.DB_URL.replace(/\/[^/]+$/, '/sheryassets_test_billing')

describe('Billing & Subscription Endpoints', () => {
  let userToken: string
  let tenantId: string
  let proPlanId: string
  let basicPlanId: string
  let userId: string

  beforeAll(async () => {
    await mongoose.connect(TEST_DB_URL)
    await mongoose.connection.db?.dropDatabase()

    await PlanService.seedDefaults()
    const { data: plans } = await PlanService.getAll()
    proPlanId = plans.find(p => p.code === 'pro')?._id.toString() || ''
    basicPlanId = plans.find(p => p.code === 'basic')?._id.toString() || ''

    // Create user
    const regularUser = await User.create({
      name: 'Billing Test User',
      email: 'billing@example.com',
      passwordHash: 'Password123!',
      role: 'user',
      isEmailVerified: true
    })
    userId = regularUser._id.toString()
    userToken = regularUser.generateAuthToken()

    // Create tenant manually since TenantService handles default creation
    const tenant = await Tenant.create({
      name: 'Billing Tenant',
      slug: 'billing-tenant',
      ownerUserId: regularUser._id,
      planId: basicPlanId,
      billingEmail: regularUser.email,
    })
    tenantId = tenant._id.toString()

    // Create membership to satisfy resolveTenant and requireRole
    await Membership.create({
      tenantId: tenant._id,
      userId: regularUser._id,
      role: 'owner',
      status: 'active'
    })

    // Mock Razorpay API call
    // @ts-expect-error Mocking Razorpay signature
    spyOn(razorpayInstance.orders, 'create').mockResolvedValue({
      id: 'order_test_123',
      amount: 2900, // 29 * 100
      currency: 'INR',
    })
  })

  afterAll(async () => {
    await mongoose.connection.db?.dropDatabase()
    await mongoose.disconnect()
    await redisConnection.quit()
  })

  describe('POST /api/v1/billing/subscribe/:planId', () => {
    it('should reject subscribing to a basic plan', async () => {
      const res = await request(app)
        .post(`/api/v1/billing/subscribe/${basicPlanId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-tenant-id', tenantId)
        .send({})

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
      expect(res.body.message).toContain('Basic plan cannot be subscribed')
    })

    it('should initiate a subscription and create an order intent for pro plan', async () => {
      const res = await request(app)
        .post(`/api/v1/billing/subscribe/${proPlanId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-tenant-id', tenantId)
        .send({})

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.orderId).toBe('order_test_123')
      expect(res.body.data.subscriptionId).toBeDefined()

      // Verify DB mapping
      const subInDb = await Subscription.findById(res.body.data.subscriptionId)
      expect(subInDb).toBeDefined()
      expect(subInDb?.status).toBe('created')
      expect(subInDb?.razorpayOrderId).toBe('order_test_123')
    })

    it('should prevent idempotency issues (double subscription if one is ACTIVE)', async () => {
      // First let's manually modify the created subscription to be ACTIVE
      await Subscription.findOneAndUpdate(
        { razorpayOrderId: 'order_test_123' },
        { status: 'active', endDate: new Date(Date.now() + 1000000000) }
      )

      const res = await request(app)
        .post(`/api/v1/billing/subscribe/${proPlanId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-tenant-id', tenantId)
        .send({})

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
      expect(res.body.message).toContain('already has an active subscription')
    })
  })

  describe('POST /api/v1/billing/webhook', () => {
    it('should reject invalid webhook signature', async () => {
      const payload = { event: 'order.paid' }
      const res = await request(app)
        .post('/api/v1/billing/webhook')
        .set('x-razorpay-signature', 'invalid_signature_abcd')
        .send(payload)

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Invalid signature')
    })

    it('should process valid webhook and update tenant', async () => {
      // Create a fresh pending order/subscription manually since the first one is bumped to active
      await Subscription.create({
        tenantId: tenantId,
        planId: proPlanId,
        userId: userId,
        razorpayOrderId: 'order_hook_111',
        amount: 2900,
        status: 'created',
      })

      const payload = {
        event: 'order.paid',
        payload: {
          payment: {
            entity: {
              order_id: 'order_hook_111',
              id: 'pay_hook_222'
            }
          }
        }
      }

      // Generate a valid signature
      // Ensure ENV handles webhook secret gracefully, or use a default
      const secret = env.RAZORPAY_WEBHOOK_SECRET || ''
      const signature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex')

      const res = await request(app)
        .post('/api/v1/billing/webhook')
        .set('x-razorpay-signature', signature)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(payload))

      expect(res.status).toBe(200)

      // Verify DB updates
      const updatedSub = await Subscription.findOne({ razorpayOrderId: 'order_hook_111' })
      expect(updatedSub?.status).toBe('active')
      expect(updatedSub?.razorpayPaymentId).toBe('pay_hook_222')

      const updatedTenant = await Tenant.findById(tenantId)
      expect(updatedTenant?.planId.toString()).toBe(proPlanId)
      expect(updatedTenant?.subscriptionStatus).toBe('active')
    })
  })
})
