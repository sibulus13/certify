import { NextResponse } from 'next/server'

const OPENAPI_SPEC = {
  openapi: '3.0.0',
  info: {
    title: 'Certify API',
    version: '1.0.0',
    description:
      'AWS CLF-C02 quiz platform. Question bank sourced from ' +
      'https://github.com/kananinirav/AWS-Certified-Cloud-Practitioner-Notes (MIT).',
    contact: { url: 'https://github.com/sibulus13/certify' },
  },
  paths: {
    '/api/health': {
      get: {
        summary: 'Service liveness and data freshness check',
        responses: {
          '200': {
            description: 'Healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['ok', 'degraded'] },
                    service: { type: 'string' },
                    timestamp: { type: 'string', format: 'date-time' },
                    traceId: { type: 'string' },
                    data: {
                      type: 'object',
                      nullable: true,
                      properties: {
                        exams: { type: 'integer' },
                        questions: { type: 'integer' },
                        generatedAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/spec': {
      get: {
        summary: 'OpenAPI 3.0 specification for this service',
        responses: {
          '200': { description: 'OpenAPI spec JSON' },
        },
      },
    },
  },
  components: {
    schemas: {
      Error: {
        type: 'object',
        required: ['error', 'code'],
        properties: {
          error: { type: 'string' },
          code: { type: 'string' },
          traceId: { type: 'string' },
        },
      },
    },
  },
}

export function GET(): NextResponse {
  return NextResponse.json(OPENAPI_SPEC)
}
