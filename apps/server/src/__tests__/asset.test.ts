import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import mongoose from 'mongoose'
import request from 'supertest'
import app from '../app'
import { env } from '../configs/ENV'
import { redisConnection } from '../configs/redis'
import PlanService from '../modules/Plan/plan.service'

const TEST_DB_URL = env.DB_URL.replace(/\/[^/]+$/, '/sheryassets_test_asset')
const tinyPngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5fWf8AAAAASUVORK5CYII=',
    'base64',
)

describe('Asset Endpoints', () => {
    const testUser = {
        name: 'Asset Tester',
        email: 'asset-test@example.com',
        password: 'Password123!',
        orgName: 'Asset Org',
    }

    let accessToken: string
    let createdApiKey: string
    let createdAssetId: string

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
            .send({ name: 'Asset Upload Key' })

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

    it('POST /assets/upload — should create asset in provided folder', async () => {
        const res = await request(app)
            .post('/api/v1/assets/upload')
            .set('X-API-KEY', createdApiKey)
            .field('folder', 'products/shoes')
            .attach('file', tinyPngBuffer, {
                filename: 'shoe-1.png',
                contentType: 'image/png',
            })

        expect(res.status).toBe(201)
        expect(res.body.success).toBe(true)
        expect(res.body.data.path).toBe('products/shoes')
        expect(res.body.data.originalKey).toContain('/products/shoes/')
        expect(res.body.data.originalKey).toContain('/original.')
        expect(res.body.data.urls.original).toContain('https://cdn.edulaunch.shop')
        expect(res.body.data.status).toBe('processing')

        createdAssetId = res.body.data._id
    })

    it('POST /assets/upload — should fallback to untitled folder when folder is not provided', async () => {
        const res = await request(app)
            .post('/api/v1/assets/upload')
            .set('X-API-KEY', createdApiKey)
            .attach('file', tinyPngBuffer, {
                filename: 'logo.png',
                contentType: 'image/png',
            })

        expect(res.status).toBe(201)
        expect(res.body.success).toBe(true)
        expect(res.body.data.path).toBe('untitled')
        expect(res.body.data.originalKey).toContain('/untitled/')
        expect(res.body.data.urls.original).toContain('/untitled/')
    })

    it('POST /assets/upload — should still support legacy path field', async () => {
        const res = await request(app)
            .post('/api/v1/assets/upload')
            .set('X-API-KEY', createdApiKey)
            .field('path', 'legacy/folder')
            .attach('file', tinyPngBuffer, {
                filename: 'legacy-file.webp',
                contentType: 'image/webp',
            })

        expect(res.status).toBe(201)
        expect(res.body.success).toBe(true)
        expect(res.body.data.path).toBe('legacy/folder')
        expect(res.body.data.originalKey).toContain('/legacy/folder/')
    })

    it('POST /assets/upload — should reject request without API key', async () => {
        const res = await request(app)
            .post('/api/v1/assets/upload')
            .attach('file', tinyPngBuffer, {
                filename: 'no-key.jpg',
                contentType: 'image/jpeg',
            })

        expect(res.status).toBe(401)
        expect(res.body.success).toBe(false)
    })

    it('GET /assets — should list tenant assets', async () => {
        const res = await request(app)
            .get('/api/v1/assets')
            .set('Authorization', `Bearer ${accessToken}`)

        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
        expect(res.body.data).toBeArray()
        expect(res.body.data.length).toBeGreaterThanOrEqual(3)
    })

    it('GET /assets — should reject unauthenticated request', async () => {
        const res = await request(app).get('/api/v1/assets')

        expect(res.status).toBe(401)
        expect(res.body.success).toBe(false)
    })

    it('GET /assets/:assetId — should fetch asset by id', async () => {
        const res = await request(app)
            .get(`/api/v1/assets/${createdAssetId}`)
            .set('Authorization', `Bearer ${accessToken}`)

        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
        expect(res.body.data._id).toBe(createdAssetId)
    })

    it('PATCH /assets/:assetId/status — should update status for owner', async () => {
        const res = await request(app)
            .patch(`/api/v1/assets/${createdAssetId}/status`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ status: 'failed' })

        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
        expect(res.body.data.status).toBe('failed')
    })

    it('DELETE /assets/:assetId — should soft delete asset', async () => {
        const res = await request(app)
            .delete(`/api/v1/assets/${createdAssetId}`)
            .set('Authorization', `Bearer ${accessToken}`)

        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
        expect(res.body.data.status).toBe('deleted')
    })

    it('GET /assets/:assetId — should return 404 for deleted asset', async () => {
        const res = await request(app)
            .get(`/api/v1/assets/${createdAssetId}`)
            .set('Authorization', `Bearer ${accessToken}`)

        expect(res.status).toBe(404)
        expect(res.body.success).toBe(false)
    })
})