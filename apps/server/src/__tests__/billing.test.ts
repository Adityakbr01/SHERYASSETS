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
import * as RazorpayService from '../services/razorpay.service'
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
    proPlanId = (plans.find(p => p.code === 'pro')?._id as mongoose.Types.ObjectId).toString() || ''
    basicPlanId = (plans.find(p => p.code === 'basic')?._id as mongoose.Types.ObjectId).toString() || ''

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
    spyOn(RazorpayService.razorpayInstance.orders, 'create').mockImplementation(() => Promise.resolve({
      id: 'order_test_123',
      amount: 2900,
      currency: 'INR',
    }) as any)
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

  describe('POST /api/v1/billing/subscribe/verify', () => {
    it('should reject unauthorized verification', async () => {
      const res = await request(app)
        .post('/api/v1/billing/subscribe/verify')
        .send({ orderId: 'ord_123', paymentId: 'pay_123', signature: 'sig_123' })

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })

    it('should return 400 for missing signature/data', async () => {
      const res = await request(app)
        .post('/api/v1/billing/subscribe/verify')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-tenant-id', tenantId)
        .send({ orderId: 'ord_123' })

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
      expect(res.body.message).toContain('Validation failed')
    })

    it('should return 404 if subscription does not exist', async () => {
      const res = await request(app)
        .post('/api/v1/billing/subscribe/verify')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-tenant-id', tenantId)
        .send({ orderId: 'order_non_existent', paymentId: 'pay_123', signature: 'sig_123' })

      expect(res.status).toBe(404)
      expect(res.body.success).toBe(false)
      expect(res.body.message).toContain('Subscription not found')
    })

    it('should fail with invalid signature', async () => {
      // Create a pending subscription
      await Subscription.create({
        tenantId: tenantId,
        planId: proPlanId,
        userId: userId,
        razorpayOrderId: 'order_fail_999',
        amount: 2900,
        status: 'created',
      })

      // Mock signature check to fail
      const sigSpy = spyOn(RazorpayService, 'verifyRazorpaySignature').mockReturnValue(false)

      const res = await request(app)
        .post('/api/v1/billing/subscribe/verify')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-tenant-id', tenantId)
        .send({ orderId: 'order_fail_999', paymentId: 'pay_111', signature: 'bad_sig' })

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
      expect(res.body.message).toContain('Payment verification failed')
      
      sigSpy.mockRestore()
    })

    it('should successfully verify and upgrade tenant', async () => {
      await Subscription.create({
        tenantId: tenantId,
        planId: proPlanId,
        userId: userId,
        razorpayOrderId: 'order_success_000',
        amount: 2900,
        status: 'created',
      })

      // Mock signature check to pass
      const sigSpy = spyOn(RazorpayService, 'verifyRazorpaySignature').mockReturnValue(true)

      const res = await request(app)
        .post('/api/v1/billing/subscribe/verify')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-tenant-id', tenantId)
        .send({ orderId: 'order_success_000', paymentId: 'pay_success_111', signature: 'good_sig' })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.message).toContain('Payment verified successfully')

      // Verify DB
      const sub = await Subscription.findOne({ razorpayOrderId: 'order_success_000' })
      expect(sub?.status).toBe('active')
      expect(sub?.razorpayPaymentId).toBe('pay_success_111')

      const tenant = await Tenant.findById(tenantId)
      expect(tenant?.planId.toString()).toBe(proPlanId)
      expect(tenant?.subscriptionStatus).toBe('active')

      sigSpy.mockRestore()
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
      // Custom error response logic might return error instead of message
      expect(res.body.success).toBe(false)
    })

    it('should process valid webhook and update tenant', async () => {
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

      const updatedSub = await Subscription.findOne({ razorpayOrderId: 'order_hook_111' })
      expect(updatedSub?.status).toBe('active')
      expect(updatedSub?.razorpayPaymentId).toBe('pay_hook_222')

      const updatedTenant = await Tenant.findById(tenantId)
      expect(updatedTenant?.planId.toString()).toBe(proPlanId)
      expect(updatedTenant?.subscriptionStatus).toBe('active')
    })
  })
})
