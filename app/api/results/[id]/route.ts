import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { checkRateLimit } from '@/lib/rate-limit'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params

  // Validate UUID format to prevent enumeration and malformed queries
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data: analysis, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !analysis) {
    return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
  }

  const { data: pageScores } = await supabase
    .from('page_scores')
    .select('*')
    .eq('analysis_id', id)
    .order('created_at', { ascending: true })

  return NextResponse.json({
    ...analysis,
    page_scores: pageScores ?? [],
  })
}
