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

    // await mongoose.connection.db?.dropDatabase()
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

  // ─── Invite User ──────────────────────────────────────────────────────────

  const user2 = {
    name: 'Invited User',
    email: 'invited@example.com',
    password: 'Password123!',
  }
  let user2AccessToken: string
  let user2Id: string
  let inviteToken: string

  it('POST /memberships/invite — should successfully invite a new email', async () => {
    const res = await request(app)
      .post('/api/v1/memberships/invite')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ email: user2.email, role: 'member' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.message).toBe('Invitation email sent successfully')
  })

  it('POST /memberships/invite — should fail if attempting to invite the owner', async () => {
    const jwtDecode = require('jsonwebtoken').decode(accessToken) as any
    await redisConnection.del(`cooldown:invite:${jwtDecode.userId}`)

    const res = await request(app)
      .post('/api/v1/memberships/invite')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ email: testUser.email, role: 'member' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('User is the owner of this tenant and has already joined')
  })

  // ─── Accept Invite ────────────────────────────────────────────────────────

  it('POST /memberships/accept-invite — user registers and gets the token', async () => {
    // 1. Manually generate a token mimicking what happens in service
    const jwt = require('jsonwebtoken')
    inviteToken = jwt.sign(
      { email: user2.email, role: 'member', tenantId, inviterId: 'some-id' },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    // 2. Register user2
    const emailLower = user2.email.toLowerCase()
    await request(app).post('/api/v1/auth/send-register-otp').send({ email: user2.email })
    const otp = await redisConnection.get(`otp:register:${emailLower}`)
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...user2, otp })

    expect(regRes.status).toBe(201)
    user2AccessToken = regRes.body.data.accessToken
    user2Id = regRes.body.data.user._id
  })

  it('POST /memberships/accept-invite — should fail if accepting with wrong email account', async () => {
    const jwt = require('jsonwebtoken')
    // Token for a different email
    const wrongToken = jwt.sign(
      { email: 'wrong-email@example.com', role: 'member', tenantId, inviterId: 'some-id' },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    const res = await request(app)
      .post('/api/v1/memberships/accept-invite')
      .set('Authorization', `Bearer ${user2AccessToken}`)
      .send({ token: wrongToken, password: 'Password123!' })

    expect(res.status).toBe(403)
    expect(res.body.message).toContain('This invitation was sent to a different email address')
  })

  it('POST /memberships/accept-invite — should successfully accept invite', async () => {
    const res = await request(app)
      .post('/api/v1/memberships/accept-invite')
      .set('Authorization', `Bearer ${user2AccessToken}`)
      .send({ token: inviteToken, password: 'Password123!' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.role).toBe('member')
  })

  it('POST /memberships/invite — should fail if attempting to invite an already joined member', async () => {
    const jwtDecode = require('jsonwebtoken').decode(accessToken) as any
    await redisConnection.del(`cooldown:invite:${jwtDecode.userId}`)

    const res = await request(app)
      .post('/api/v1/memberships/invite')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ email: user2.email, role: 'member' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('User has already joined this tenant')
  })

  // ─── Remove Member ────────────────────────────────────────────────────────

  it('POST /memberships/remove-member — should fail if trying to remove the owner', async () => {
    // Current user context via accessToken is testUser (the owner)
    // trying to remove themselves
    const jwtDecode = require('jsonwebtoken').decode(accessToken) as any
    const ownerId = jwtDecode.userId

    const res = await request(app)
      .post('/api/v1/memberships/remove-member')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ userId: ownerId })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('Cannot remove the owner of the tenant')
  })

  it('POST /memberships/remove-member — should successfully remove the accepted member', async () => {
    const res = await request(app)
      .post('/api/v1/memberships/remove-member')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ userId: user2Id })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.message).toBe('Member removed successfully')
  })

  it('POST /memberships/remove-member — should fail if removing a non-active/non-existent member', async () => {
    const res = await request(app)
      .post('/api/v1/memberships/remove-member')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ userId: user2Id }) // Just removed them, should not be active

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('Active membership not found for this user in this tenant')
  })
})
