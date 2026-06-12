import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest): NextResponse {
  const traceId = request.headers.get('x-trace-id') ?? crypto.randomUUID()
  const response = NextResponse.next({
    request: { headers: new Headers({ ...Object.fromEntries(request.headers), 'x-trace-id': traceId }) },
  })
  response.headers.set('x-trace-id', traceId)
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}
