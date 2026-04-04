import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import request from 'supertest'
import mongoose from 'mongoose'
import app from '../app'
import { env } from '../configs/ENV'
import { redisConnection } from '../configs/redis'
import PlanService from '../modules/Plan/plan.service'

// ─── Test DB ────────────────────────────────────────────────────────────────────

const TEST_DB_URL = env.DB_URL.replace(/\/[^/]+$/, '/sheryassets_test_auth')

describe('Auth Endpoints', () => {
  const testUser = {
    name: 'Test User',
    email: 'auth-test@example.com',
    password: 'Password123!',
    orgName: 'Test Organization',
  }

  let accessToken: string
  let refreshToken: string
  let tenantId: string

  // ─── Setup & Teardown ───────────────────────────────────────────────────────

  beforeAll(async () => {
    await mongoose.connect(TEST_DB_URL)
    await mongoose.connection.db?.dropDatabase()
    await PlanService.seedDefaults()
  })

  afterAll(async () => {
    const emailLower = testUser.email.toLowerCase()
    await redisConnection.del(`otp:register:${emailLower}`)
    await redisConnection.del(`cooldown:register:${emailLower}`)

    await mongoose.connection.db?.dropDatabase()
  })

  // ─── Health Check ───────────────────────────────────────────────────────────

  it('GET /api/v1/health — should return healthy status', async () => {
    const res = await request(app).get('/api/v1/health')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.message).toBe('API is healthy')
  })

  // ─── OTP Flow ───────────────────────────────────────────────────────────────

  it('POST /auth/send-register-otp — should send OTP for new email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/send-register-otp')
      .send({ email: testUser.email })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('POST /auth/send-register-otp — should block rapid re-sends (cooldown)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/send-register-otp')
      .send({ email: testUser.email })

    expect(res.status).toBe(429)
    expect(res.body.success).toBe(false)
  })

  it('POST /auth/send-register-otp — should reject invalid email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/send-register-otp')
      .send({ email: 'not-an-email' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('POST /auth/send-register-otp — should reject missing email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/send-register-otp')
      .send({})

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  // ─── Registration ───────────────────────────────────────────────────────────

  it('POST /auth/register — should reject with wrong OTP', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...testUser, otp: '000000' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('POST /auth/register — should reject with invalid body (short password)', async () => {
    const otp = await redisConnection.get(`otp:register:${testUser.email.toLowerCase()}`)

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...testUser, password: '123', otp })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('POST /auth/register — should reject missing name', async () => {
    const otp = await redisConnection.get(`otp:register:${testUser.email.toLowerCase()}`)

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: testUser.email, password: testUser.password, otp })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('POST /auth/register — should register a new user with valid OTP', async () => {
    const otpKey = `otp:register:${testUser.email.toLowerCase()}`
    const otp = await redisConnection.get(otpKey)
    expect(otp).toBeDefined()

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...testUser, otp })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.user.email).toBe(testUser.email)
    expect(res.body.data.user.name).toBe(testUser.name)
    expect(res.body.data.accessToken).toBeDefined()
    expect(res.body.data.refreshToken).toBeDefined()
    expect(res.body.data.tenants).toBeArray()
    expect(res.body.data.tenants.length).toBeGreaterThanOrEqual(1)

    // Store for later tests
    accessToken = res.body.data.accessToken
    refreshToken = res.body.data.refreshToken
    tenantId = res.body.data.tenants[0].tenantId
  })

  it('POST /auth/register — should reject duplicate email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...testUser, otp: '123456' })

    expect(res.status).toBe(409)
    expect(res.body.success).toBe(false)
  })

  // ─── Login ──────────────────────────────────────────────────────────────────

  it('POST /auth/login — should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.user.email).toBe(testUser.email)
    expect(res.body.data.accessToken).toBeDefined()
    expect(res.body.data.refreshToken).toBeDefined()
    expect(res.body.data.tenants).toBeArray()

    // Update tokens for subsequent tests
    accessToken = res.body.data.accessToken
    refreshToken = res.body.data.refreshToken
  })

  it('POST /auth/login — should reject invalid password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: 'WrongPassword' })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('POST /auth/login — should reject non-existent email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'Password123!' })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('POST /auth/login — should reject missing password field', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  // ─── Profile (me) ──────────────────────────────────────────────────────────

  it('GET /auth/me — should fetch current user profile', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.email).toBe(testUser.email)
    expect(res.body.data.name).toBe(testUser.name)
    expect(res.body.data.tenants).toBeArray()
  })

  it('GET /auth/me — should reject without token', async () => {
    const res = await request(app).get('/api/v1/auth/me')

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('GET /auth/me — should reject with invalid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid.token.string')

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  // ─── Switch Tenant ──────────────────────────────────────────────────────────

  it('POST /auth/switch-tenant — should switch to a valid tenant', async () => {
    const res = await request(app)
      .post('/api/v1/auth/switch-tenant')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ tenantId })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.accessToken).toBeDefined()
    expect(res.body.data.tenant.tenantId).toBe(tenantId)

    // Update access token to the tenant-scoped one
    accessToken = res.body.data.accessToken
  })

  it('POST /auth/switch-tenant — should reject invalid tenantId', async () => {
    const res = await request(app)
      .post('/api/v1/auth/switch-tenant')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ tenantId: '000000000000000000000000' })

    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)
  })

  it('POST /auth/switch-tenant — should reject missing tenantId', async () => {
    const res = await request(app)
      .post('/api/v1/auth/switch-tenant')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  // ─── Token Refresh ──────────────────────────────────────────────────────────

  it('POST /auth/refresh — should refresh tokens with valid refreshToken', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.accessToken).toBeDefined()
    expect(res.body.data.refreshToken).toBeDefined()
    expect(res.body.data.user.email).toBe(testUser.email)

    // Update tokens
    accessToken = res.body.data.accessToken
    refreshToken = res.body.data.refreshToken
  })

  it('POST /auth/refresh — should reject with invalid refresh token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'invalid.refresh.token' })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  // ─── Forgot Password ────────────────────────────────────────────────────────

  it('POST /auth/forgot-password — should send reset link for valid email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: testUser.email })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('POST /auth/forgot-password — should reject for non-existent email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'nonexistent@example.com' })

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  // ─── Reset Password ─────────────────────────────────────────────────────────

  it('POST /auth/reset-password — should reject with invalid token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: 'invalid.token.string', password: 'NewPassword123!' })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('POST /auth/reset-password — should allow password reset with valid token', async () => {
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)

    const userId = meRes.body.data._id

    // Import jsonwebtoken dynamically just for the test
    const jwt = (await import('jsonwebtoken')).default
    const resetToken = jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: '5m' })

    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: resetToken, password: 'UpdatedPassword123!' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('POST /auth/login — should login with the newly updated password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: 'UpdatedPassword123!' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)

    accessToken = res.body.data.accessToken
    refreshToken = res.body.data.refreshToken
  })

  // ─── Logout ─────────────────────────────────────────────────────────────────

  it('POST /auth/logout — should logout successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.message).toBe('Logged out successfully')
  })

  it('POST /auth/refresh — should reject stale refresh token after logout', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken })

    // Token was cleared on logout — should be rejected
    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })
})


