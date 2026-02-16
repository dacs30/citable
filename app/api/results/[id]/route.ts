import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

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
