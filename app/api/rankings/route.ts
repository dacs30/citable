import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createServerClient()

  // Get the latest completed analysis per domain, ranked by score
  const { data, error } = await supabase
    .from('analyses')
    .select('id, domain, url, overall_score, created_at')
    .eq('status', 'completed')
    .not('overall_score', 'is', null)
    .order('overall_score', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch rankings' }, { status: 500 })
  }

  // Keep only the most recent analysis per domain
  const seen = new Set<string>()
  const rankings = (data ?? []).filter((row: { domain: string }) => {
    if (seen.has(row.domain)) return false
    seen.add(row.domain)
    return true
  })

  return NextResponse.json(rankings)
}
