import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import request from 'supertest'
import mongoose from 'mongoose'
import app from '../app'
import { env } from '../configs/ENV'
import { redisConnection } from '../configs/redis'
import PlanService from '../modules/Plan/plan.service'

// ─── Test DB ────────────────────────────────────────────────────────────────────

const TEST_DB_URL = env.DB_URL.replace(/\/[^/]+$/, '/sheryassets_test_tenant')

describe('Tenant Endpoints', () => {
  const testUser = {
    name: 'Tenant Tester',
    email: 'tenant-test@example.com',
    password: 'Password123!',
    orgName: 'Tenant Org',
  }

  let accessToken: string
  let tenantId: string
  let tenantSlug: string

  // ─── Setup ──────────────────────────────────────────────────────────────────

  beforeAll(async () => {
    await mongoose.connect(TEST_DB_URL)
    await mongoose.connection.db?.dropDatabase()
    await PlanService.seedDefaults()

    // Register a user to get tokens + tenant
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
    tenantSlug = regRes.body.data.tenants[0].slug
  })

  afterAll(async () => {
    const emailLower = testUser.email.toLowerCase()
    await redisConnection.del(`otp:register:${emailLower}`)
    await redisConnection.del(`cooldown:register:${emailLower}`)

    await mongoose.connection.db?.dropDatabase()
    await mongoose.disconnect()
    await redisConnection.quit()
  })

  // ─── My Tenants ─────────────────────────────────────────────────────────────

  it('GET /tenants/my-tenants — should fetch user tenants', async () => {
    const res = await request(app)
      .get('/api/v1/tenants/my-tenants')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toBeArray()
    expect(res.body.data.length).toBeGreaterThanOrEqual(1)

    const tenant = res.body.data[0]
    expect(tenant.name).toBe(testUser.orgName)
    expect(tenant.status).toBe('active')
  })

  it('GET /tenants/my-tenants — should reject unauthenticated request', async () => {
    const res = await request(app).get('/api/v1/tenants/my-tenants')

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  // ─── Tenant by Slug ────────────────────────────────────────────────────────

  it('GET /tenants/slug/:slug — should fetch tenant by slug', async () => {
    const res = await request(app)
      .get(`/api/v1/tenants/slug/${tenantSlug}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.slug).toBe(tenantSlug)
    expect(res.body.data._id).toBe(tenantId)
  })

  it('GET /tenants/slug/:slug — should return 404 for non-existent slug', async () => {
    const res = await request(app)
      .get('/api/v1/tenants/slug/does-not-exist-slug-xyz')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  it('GET /tenants/slug/:slug — should reject unauthenticated request', async () => {
    const res = await request(app).get(`/api/v1/tenants/slug/${tenantSlug}`)

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })
})
