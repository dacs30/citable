import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { runAnalysis } from '@/lib/analyze'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { url, scraper_type, firecrawl_api_key } = body as {
      url?: string
      scraper_type?: string
      firecrawl_api_key?: string
    }

    // Validate URL
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const trimmed = url.trim()
    let normalizedUrl = trimmed
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`
    }

    try {
      new URL(normalizedUrl)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // Validate scraper type
    const scraperType = scraper_type === 'firecrawl' ? 'firecrawl' : 'playwright'

    if (scraperType === 'firecrawl' && !firecrawl_api_key) {
      return NextResponse.json(
        { error: 'Firecrawl API key is required when using firecrawl scraper' },
        { status: 400 }
      )
    }

    // Extract domain
    const domain = new URL(normalizedUrl).hostname

    // Create analysis record
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('analyses')
      .insert({
        url: normalizedUrl,
        domain,
        scraper_type: scraperType,
        status: 'pending',
      })
      .select('id')
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Failed to create analysis' },
        { status: 500 }
      )
    }

    // Fire-and-forget background analysis
    runAnalysis(data.id, normalizedUrl, scraperType, firecrawl_api_key).catch(
      console.error
    )

    return NextResponse.json({ id: data.id })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
