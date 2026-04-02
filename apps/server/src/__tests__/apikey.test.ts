import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import request from 'supertest'
import mongoose from 'mongoose'
import app from '../app'
import { env } from '../configs/ENV'
import { redisConnection } from '../configs/redis'
import PlanService from '../modules/Plan/plan.service'

// ─── Test DB ────────────────────────────────────────────────────────────────────

const TEST_DB_URL = env.DB_URL.replace(/\/[^/]+$/, '/sheryassets_test_apikey')

describe('API Key Endpoints', () => {
  const testUser = {
    name: 'ApiKey Tester',
    email: 'apikey-test@example.com',
    password: 'Password123!',
    orgName: 'ApiKey Org',
  }

  let accessToken: string
  let tenantId: string
  let createdKeyId: string
  let createdRawKey: string

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

    // Switch tenant to get a tenant-scoped token (required for API key routes)
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

  // ─── Create API Key ────────────────────────────────────────────────────────

  it('POST /api-keys — should create a new API key', async () => {
    const res = await request(app)
      .post('/api/v1/api-keys')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Test Key' })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.apiKey).toBeDefined()
    expect(res.body.data.apiKey).toStartWith('shry_')
    expect(res.body.data.name).toBe('Test Key')
    expect(res.body.data.id).toBeDefined()

    createdKeyId = res.body.data.id
    createdRawKey = res.body.data.apiKey
    console.log(createdRawKey)
  })

  it('POST /api-keys — should reject missing name', async () => {
    const res = await request(app)
      .post('/api/v1/api-keys')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('POST /api-keys — should reject empty name', async () => {
    const res = await request(app)
      .post('/api/v1/api-keys')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: '   ' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('POST /api-keys — should reject unauthenticated request', async () => {
    const res = await request(app)
      .post('/api/v1/api-keys')
      .send({ name: 'Rogue Key' })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  // ─── List API Keys ─────────────────────────────────────────────────────────

  it('GET /api-keys — should list API keys for the tenant', async () => {
    const res = await request(app)
      .get('/api/v1/api-keys')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toBeArray()
    expect(res.body.data.length).toBeGreaterThanOrEqual(1)

    const key = res.body.data[0]
    expect(key.name).toBe('Test Key')
    expect(key.status).toBe('active')
    // keyHash must NOT be exposed
    expect(key.keyHash).toBeUndefined()
  })

  it('GET /api-keys — should reject unauthenticated request', async () => {
    const res = await request(app).get('/api/v1/api-keys')

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  // ─── Create second key ─────────────────────────────────────────────────────

  it('POST /api-keys — should create a second API key', async () => {
    const res = await request(app)
      .post('/api/v1/api-keys')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Second Key' })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.name).toBe('Second Key')
  })

  // ─── Revoke API Key ────────────────────────────────────────────────────────

  it('PATCH /api-keys/:keyId/revoke — should revoke an API key', async () => {
    const res = await request(app)
      .patch(`/api/v1/api-keys/${createdKeyId}/revoke`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.status).toBe('revoked')
  })

  it('PATCH /api-keys/:keyId/revoke — should fail to revoke already revoked key', async () => {
    const res = await request(app)
      .patch(`/api/v1/api-keys/${createdKeyId}/revoke`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  it('PATCH /api-keys/:keyId/revoke — should fail with fake keyId', async () => {
    const res = await request(app)
      .patch('/api/v1/api-keys/000000000000000000000000/revoke')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  it('PATCH /api-keys/:keyId/revoke — should reject unauthenticated', async () => {
    const res = await request(app)
      .patch(`/api/v1/api-keys/${createdKeyId}/revoke`)

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })
})
