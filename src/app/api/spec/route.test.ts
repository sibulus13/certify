// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { GET } from './route'

describe('GET /api/spec', () => {
  it('returns a valid OpenAPI 3.0 object', async () => {
    const res = GET()
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.openapi).toBe('3.0.0')
    expect(body.info.title).toBeTruthy()
    expect(body.info.version).toBeTruthy()
    expect(body.paths).toBeDefined()
  })

  it('includes /api/health path', async () => {
    const res = GET()
    const body = await res.json()
    expect(body.paths['/api/health']).toBeDefined()
    expect(body.paths['/api/health'].get).toBeDefined()
  })

  it('includes /api/spec path', async () => {
    const res = GET()
    const body = await res.json()
    expect(body.paths['/api/spec']).toBeDefined()
  })

  it('includes source attribution in description', async () => {
    const res = GET()
    const body = await res.json()
    expect(body.info.description).toContain('kananinirav/AWS-Certified-Cloud-Practitioner-Notes')
  })

  it('includes Error schema component', async () => {
    const res = GET()
    const body = await res.json()
    expect(body.components.schemas.Error).toBeDefined()
    expect(body.components.schemas.Error.required).toContain('error')
    expect(body.components.schemas.Error.required).toContain('code')
  })
})
