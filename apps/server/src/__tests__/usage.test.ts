import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import mongoose from 'mongoose'
import request from 'supertest'
import app from '../app'
import { env } from '../configs/ENV'
import { redisConnection } from '../configs/redis'
import PlanService from '../modules/Plan/plan.service'

const TEST_DB_URL = env.DB_URL.replace(/\/[^/]+$/, '/sheryassets_test_usage')

describe('Usage Endpoints', () => {
    const usageMonth = '2026-04'
    const testUser = {
        name: 'Usage Tester',
        email: 'usage-test@example.com',
        password: 'Password123!',
        orgName: 'Usage Org',
    }

    let accessToken: string
    let createdApiKey: string

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

        const registerRes = await request(app)
            .post('/api/v1/auth/register')
            .send({ ...testUser, otp })

        accessToken = registerRes.body.data.accessToken
        const tenantId = registerRes.body.data.tenants[0].tenantId as string

        const switchRes = await request(app)
            .post('/api/v1/auth/switch-tenant')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ tenantId })

        accessToken = switchRes.body.data.accessToken

        const keyRes = await request(app)
            .post('/api/v1/api-keys')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ name: 'Usage Tracking Key' })

        createdApiKey = keyRes.body.data.apiKey
    })

    afterAll(async () => {
        const emailLower = testUser.email.toLowerCase()
        await redisConnection.del(`otp:register:${emailLower}`)
        await redisConnection.del(`cooldown:register:${emailLower}`)

        await mongoose.connection.db?.dropDatabase()
        await mongoose.disconnect()
        await redisConnection.quit()
    })

    it('POST /usage/track/upload — should track upload usage', async () => {
        const res = await request(app)
            .post('/api/v1/usage/track/upload')
            .set('X-API-KEY', createdApiKey)
            .send({
                sizeBytes: 2048,
                month: usageMonth,
            })

        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
        expect(res.body.data.uploadCount).toBe(1)
        expect(res.body.data.bandwidthBytes).toBe(2048)
        expect(res.body.data.month).toBe(usageMonth)
    })

    it('POST /usage/track/delivery — should track cache hit usage', async () => {
        const res = await request(app)
            .post('/api/v1/usage/track/delivery')
            .set('X-API-KEY', createdApiKey)
            .send({
                bandwidthBytes: 4096,
                cacheStatus: 'hit',
                transformationCount: 2,
                month: usageMonth,
            })

        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
        expect(res.body.data.transformationCount).toBe(2)
        expect(res.body.data.cacheHitCount).toBe(1)
        expect(res.body.data.originFetchCount).toBe(0)
        expect(res.body.data.bandwidthBytes).toBe(6144)
    })

    it('POST /usage/track/delivery — should track cache miss usage', async () => {
        const res = await request(app)
            .post('/api/v1/usage/track/delivery')
            .set('X-API-KEY', createdApiKey)
            .send({
                bandwidthBytes: 1024,
                cacheStatus: 'miss',
                transformationCount: 1,
                month: usageMonth,
            })

        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
        expect(res.body.data.transformationCount).toBe(3)
        expect(res.body.data.cacheHitCount).toBe(1)
        expect(res.body.data.originFetchCount).toBe(1)
        expect(res.body.data.bandwidthBytes).toBe(7168)
    })

    it('GET /usage/monthly — should fetch monthly summary for tenant', async () => {
        const res = await request(app)
            .get(`/api/v1/usage/monthly?month=${usageMonth}`)
            .set('Authorization', `Bearer ${accessToken}`)

        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
        expect(res.body.data.month).toBe(usageMonth)
        expect(res.body.data.usage.uploadCount).toBe(1)
        expect(res.body.data.usage.transformationCount).toBe(3)
        expect(res.body.data.usage.bandwidthBytes).toBe(7168)
    })

    it('GET /usage/history — should fetch monthly history', async () => {
        const res = await request(app)
            .get('/api/v1/usage/history?limit=2')
            .set('Authorization', `Bearer ${accessToken}`)

        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
        expect(res.body.data).toBeArray()
        expect(res.body.data.length).toBeGreaterThanOrEqual(1)
        expect(res.body.data[0].month).toBe(usageMonth)
    })

    it('GET /usage/totals — should return aggregated totals', async () => {
        const res = await request(app)
            .get('/api/v1/usage/totals')
            .set('Authorization', `Bearer ${accessToken}`)

        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
        expect(res.body.data.uploadCount).toBe(1)
        expect(res.body.data.transformationCount).toBe(3)
        expect(res.body.data.bandwidthBytes).toBe(7168)
        expect(res.body.data.cacheHitCount).toBe(1)
        expect(res.body.data.originFetchCount).toBe(1)
    })

    it('POST /usage/track/upload — should reject invalid month format', async () => {
        const res = await request(app)
            .post('/api/v1/usage/track/upload')
            .set('X-API-KEY', createdApiKey)
            .send({
                sizeBytes: 500,
                month: '2026/04',
            })

        expect(res.status).toBe(400)
        expect(res.body.success).toBe(false)
    })

    it('POST /usage/track/upload — should reject request without API key', async () => {
        const res = await request(app)
            .post('/api/v1/usage/track/upload')
            .send({
                sizeBytes: 500,
            })

        expect(res.status).toBe(401)
        expect(res.body.success).toBe(false)
    })

    it('GET /usage/totals — should reject unauthenticated request', async () => {
        const res = await request(app).get('/api/v1/usage/totals')

        expect(res.status).toBe(401)
        expect(res.body.success).toBe(false)
    })
})