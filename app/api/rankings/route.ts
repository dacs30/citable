import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { checkRateLimit } from '@/lib/rate-limit'

const PAGE_SIZE = 50

const LIMIT = 1000

export async function GET(request: NextRequest) {
  // Rate limiting
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  const rateLimitResult = checkRateLimit(ip)
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimitResult.retryAfterSeconds) },
      }
    )
  }

  const supabase = createServerClient()

  const { searchParams } = request.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)

  // Get the latest completed analysis per domain, ranked by score
  const { data, error } = await supabase
    .from('analyses')
    .select('id, domain, url, overall_score, created_at')
    .eq('status', 'completed')
    .not('overall_score', 'is', null)
    .order('overall_score', { ascending: false })
    .limit(LIMIT)

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch rankings' }, { status: 500 })
  }

  // Keep only the most recent analysis per domain
  const seen = new Set<string>()
  const allRankings = (data ?? []).filter((row: { domain: string }) => {
    if (seen.has(row.domain)) return false
    seen.add(row.domain)
    return true
  })

  const totalItems = allRankings.length
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const startIndex = (safePage - 1) * PAGE_SIZE
  const rankings = allRankings.slice(startIndex, startIndex + PAGE_SIZE)

  return NextResponse.json({
    data: rankings,
    pagination: {
      page: safePage,
      pageSize: PAGE_SIZE,
      totalPages,
      totalItems,
    },
  })
}
