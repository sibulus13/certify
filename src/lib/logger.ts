import pino from 'pino'
import type { LogEvent } from './types'

// Server-only — do not import in client components
const isDev = process.env.NODE_ENV === 'development'

export const logger = pino({
  level: (process.env.LOG_LEVEL ?? 'info').trim(),
  base: { service: 'certify' },
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss' },
        },
      }
    : {}),
})

export function logEvent(
  event: LogEvent,
  data: Record<string, unknown>,
  traceId?: string
): void {
  logger.info({ event, traceId, ...data })
}

// Called when a runtime value deviates from SPEC.md — these are actionable errors
export function logSpecDeviation(
  check: string,
  expected: unknown,
  actual: unknown,
  traceId?: string
): void {
  logger.error({ event: 'SPEC_DEVIATION' as LogEvent, check, expected, actual, traceId })
}
