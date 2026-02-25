import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * CORS + origin enforcement for API routes.
 * Blocks cross-origin requests unless the Origin matches the app's own host.
 */
export function proxy(request: NextRequest) {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')

  // Determine the allowed origin from the Host header (same-origin)
  const proto = request.headers.get('x-forwarded-proto') ?? 'https'
  const allowedOrigin = host ? `${proto}://${host}` : null

  // For preflight OPTIONS requests, return CORS headers immediately
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin ?? '',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  // For actual requests: block cross-origin calls
  // (origin is null for same-origin navigations and server-to-server calls)
  if (origin && allowedOrigin && origin !== allowedOrigin) {
    return NextResponse.json(
      { error: 'Cross-origin requests are not allowed' },
      { status: 403 }
    )
  }

  const response = NextResponse.next()

  // Set CORS headers on the response
  if (allowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')

  return response
}

// Only run middleware on API routes
export const config = {
  matcher: '/api/:path*',
}
