import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import request from 'supertest'

import app from '../app'
import { env } from '../configs/ENV'

describe('Docs Endpoints (Internal vs Public)', () => {
  const originalDocsToken = env.INTERNAL_DOCS_ACCESS_TOKEN
  const testDocsToken = 'internal-docs-test-token'

  beforeAll(() => {
    env.INTERNAL_DOCS_ACCESS_TOKEN = testDocsToken
  })

  afterAll(() => {
    env.INTERNAL_DOCS_ACCESS_TOKEN = originalDocsToken
  })

  it('GET /swagger.json without token should be blocked', async () => {
    const res = await request(app).get('/swagger.json')

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('GET /swagger.json with token should return internal swagger', async () => {
    const res = await request(app)
      .get('/swagger.json')
      .set('x-internal-docs-token', testDocsToken)

    expect(res.status).toBe(200)
    expect(res.body.openapi).toBe('3.0.0')
    expect(res.body.paths).toBeObject()
  })

  it('GET /api-docs without token should be blocked', async () => {
    const res = await request(app).get('/api-docs')

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('GET /public/swagger.json should be public and accessible', async () => {
    const res = await request(app).get('/public/swagger.json')

    expect(res.status).toBe(200)
    expect(res.body.openapi).toBe('3.0.0')
    expect(res.body.paths).toBeObject()
  })

  it('GET /public/swagger.json should include public paths and exclude internal-only paths', async () => {
    const res = await request(app).get('/public/swagger.json')

    expect(res.status).toBe(200)
    expect(res.body.paths['/api/v1/assets/upload']).toBeDefined()
    expect(res.body.paths['/api/v1/usage/track/upload']).toBeUndefined()
    expect(res.body.paths['/api/v1/memberships/invite']).toBeUndefined()
    expect(res.body.paths['/api/v1/billing/subscribe/{planId}']).toBeUndefined()
  })

  it('GET /developer-docs should be public and render swagger ui', async () => {
    const res = await request(app).get('/developer-docs/')

    expect(res.status).toBe(200)
    expect(res.text).toContain('Swagger UI')
  })
})
