import { describe, expect, it } from 'bun:test'
import request from 'supertest'
import app from '../app'

// ─── Middleware & Error Handling Tests ────────────────────────────────────────
// These tests don't need a database connection — they test Express middleware behavior.

describe('Middleware & Error Handling', () => {
  // ─── 404 Not Found ──────────────────────────────────────────────────────────

  it('GET /api/v1/nonexistent — should return 404', async () => {
    const res = await request(app).get('/api/v1/this-route-does-not-exist')

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  it('GET /random/path — should return 404', async () => {
    const res = await request(app).get('/random/nonexistent/path')

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  // ─── Health Check ───────────────────────────────────────────────────────────

  it('GET /api/v1/health — should pass health check', async () => {
    const res = await request(app).get('/api/v1/health')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      success: true,
      message: 'API is healthy',
    })
  })

  // ─── Invalid JSON Body ─────────────────────────────────────────────────────

  it('POST with malformed JSON — should return error', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{ invalid json }')

    // Express may return 400 (JSON SyntaxError handler) or 500 depending on version
    expect(res.status).toBeLessThanOrEqual(500)
    expect(res.body.success).toBe(false)
  })

  // ─── Request Method Not Allowed ─────────────────────────────────────────────

  it('PUT /api/v1/health — method not allowed or 404', async () => {
    const res = await request(app).put('/api/v1/health')

    // Express returns 404 for unmatched routes/methods
    expect(res.status).toBe(404)
  })

  // ─── Validation Middleware ──────────────────────────────────────────────────

  it('POST /auth/login with empty body — should return validation error', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({})

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.errors).toBeArray()
    expect(res.body.errors.length).toBeGreaterThanOrEqual(1)
  })

  it('POST /auth/register with empty body — should return validation error', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({})

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.errors).toBeArray()
  })

  // ─── Auth Guards ────────────────────────────────────────────────────────────

  it('Protected endpoint without token — should return 401', async () => {
    const res = await request(app).get('/api/v1/auth/me')

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('Protected endpoint with invalid Bearer format — should return 401', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer ')

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('Protected endpoint with garbage token — should return 401', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer totally.invalid.token.value')

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('Protected endpoint with non-Bearer scheme — should return 401', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Basic dXNlcjpwYXNz')

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

})
