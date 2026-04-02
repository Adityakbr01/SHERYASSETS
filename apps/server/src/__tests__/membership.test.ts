import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import request from 'supertest'
import mongoose from 'mongoose'
import app from '../app'
import { env } from '../configs/ENV'
import { redisConnection } from '../configs/redis'
import PlanService from '../modules/Plan/plan.service'

// ─── Test DB ────────────────────────────────────────────────────────────────────

const TEST_DB_URL = env.DB_URL.replace(/\/[^/]+$/, '/sheryassets_test_membership')

describe('Membership Endpoints', () => {
  const testUser = {
    name: 'Membership Tester',
    email: 'membership-test@example.com',
    password: 'Password123!',
    orgName: 'Membership Org',
  }

  let accessToken: string
  let tenantId: string

  // ─── Setup ──────────────────────────────────────────────────────────────────

  beforeAll(async () => {
    await mongoose.connect(TEST_DB_URL)
    await mongoose.connection.db?.dropDatabase()
    await PlanService.seedDefaults()

    const emailLower = testUser.email.toLowerCase()
    await redisConnection.del(`cooldown:register:${emailLower}`)

    await request(app)
      .post('/api/v1/auth/send-register-otp')
      .send({ email: testUser.email })

    const otp = await redisConnection.get(`otp:register:${emailLower}`)

    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...testUser, otp })

    accessToken = regRes.body.data.accessToken
    tenantId = regRes.body.data.tenants[0].tenantId

    // Switch tenant to get a tenant-scoped token
    const switchRes = await request(app)
      .post('/api/v1/auth/switch-tenant')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ tenantId })

    accessToken = switchRes.body.data.accessToken
  })

  afterAll(async () => {
    const emailLower = testUser.email.toLowerCase()
    await redisConnection.del(`otp:register:${emailLower}`)
    await redisConnection.del(`cooldown:register:${emailLower}`)

    await mongoose.connection.db?.dropDatabase()
    await mongoose.disconnect()
    await redisConnection.quit()
  })

  // ─── My Memberships ────────────────────────────────────────────────────────

  it('GET /memberships/mine — should return the user memberships', async () => {
    const res = await request(app)
      .get('/api/v1/memberships/mine')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toBeArray()
    expect(res.body.data.length).toBeGreaterThanOrEqual(1)

    const membership = res.body.data[0]
    expect(membership.role).toBe('owner')
    expect(membership.tenantId).toBeDefined()
  })

  it('GET /memberships/mine — should reject unauthenticated request', async () => {
    const res = await request(app).get('/api/v1/memberships/mine')

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  // ─── Tenant Members ────────────────────────────────────────────────────────

  it('GET /memberships/tenant-members — should list tenant members as owner', async () => {
    const res = await request(app)
      .get('/api/v1/memberships/tenant-members')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toBeArray()
    expect(res.body.data.length).toBeGreaterThanOrEqual(1)
  })

  it('GET /memberships/tenant-members — should reject unauthenticated request', async () => {
    const res = await request(app).get('/api/v1/memberships/tenant-members')

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })
})
