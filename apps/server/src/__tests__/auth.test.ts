import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import request from 'supertest'
import mongoose from 'mongoose'
import app from '../app'
import { env } from '../configs/ENV'
import { redisConnection } from '../configs/redis'

// Use a separate test database
const TEST_DB_URL = env.DB_URL.replace(/\/[^/]+$/, '/sheryassets_test_db')

describe('Auth Endpoints', () => {
  const testUser = {
    name: 'Test User',
    email: 'testuser@example.com',
    password: 'password123',
    tenantId: 'test-tenant',
  }

  let accessToken: string

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(TEST_DB_URL)
    await mongoose.connection.db?.dropDatabase()
  })

  afterAll(async () => {
    await mongoose.connection.db?.dropDatabase()
    await mongoose.disconnect()

    // Clean up Redis keys cleanly
    const emailLower = testUser.email.toLowerCase()
    await redisConnection.del(`otp:register:${emailLower}`)
    await redisConnection.del(`cooldown:register:${emailLower}`)

    await redisConnection.quit()
  })

  it('should send a registration OTP', async () => {
    const response = await request(app)
      .post('/api/v1/auth/send-register-otp')
      .send({ email: testUser.email })

    if (response.status !== 200) console.error('OTP RESPONSE:', response.body)

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
  })

  it('should not allow sending another OTP immediately (cooldown)', async () => {
    const response = await request(app)
      .post('/api/v1/auth/send-register-otp')
      .send({ email: testUser.email })

    expect(response.status).toBe(429)
    expect(response.body.success).toBe(false)
  })

  it('should register a new user with valid OTP', async () => {
    // Get OTP from redis directly for testing
    const otpKey = `otp:register:${testUser.email.toLowerCase()}`
    const otp = await redisConnection.get(otpKey)

    expect(otp).toBeDefined()

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...testUser, otp })

    expect(response.status).toBe(201)
    expect(response.body.success).toBe(true)
    expect(response.body.data.user.email).toBe(testUser.email)
    expect(response.body.data.accessToken).toBeDefined()
  })

  it('should not register user with same email', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...testUser, otp: '123456' })

    expect(response.status).toBe(409) // or whatever your ApiError statusCode is
    expect(response.body.success).toBe(false)
  })

  it('should login the user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password })

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data.accessToken).toBeDefined()

    accessToken = response.body.data.accessToken
  })

  it('should fetch the current user profile (me)', async () => {
    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data.user.email).toBe(testUser.email)
  })

  it('should logout the user', async () => {
    // Usually uses refresh token in cookies/body for logout
    const response = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)

    // Depending on what your logout endpoint enforces,
    // it can be 200 ok (just clearing cookies).
    expect(response.status).toBe(200)
    expect(response.body.message).toBe('Logout successful')
  })
})
