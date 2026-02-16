import { NextResponse, after } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { runAnalysis } from '@/lib/analyze'
import { validateUrlForScraping } from '@/lib/url-validator'
import { checkRateLimit } from '@/lib/rate-limit'

// Vercel Pro: allow up to 60s for background analysis to complete
export const maxDuration = 60

export async function POST(request: Request) {
  try {
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
          headers: {
            'Retry-After': String(rateLimitResult.retryAfterSeconds),
          },
        }
      )
    }

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

    // SSRF-safe URL validation (blocks private IPs, cloud metadata, etc.)
    const urlValidation = await validateUrlForScraping(url)
    if (!urlValidation.valid) {
      return NextResponse.json(
        { error: urlValidation.error },
        { status: 400 }
      )
    }
    const normalizedUrl = urlValidation.normalizedUrl!

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

    // Run analysis in the background using after() — Vercel keeps the
    // function alive after the response is sent (requires Pro plan).
    // A 55s timeout guard ensures the analysis is marked as failed before
    // Vercel kills the function at 60s, preventing stuck "processing" records.
    after(async () => {
      const TIMEOUT_MS = 55_000
      const supabaseForTimeout = createServerClient()

      try {
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Analysis timed out after 55 seconds')), TIMEOUT_MS)
        )
        await Promise.race([
          runAnalysis(data.id, normalizedUrl, scraperType, firecrawl_api_key),
          timeout,
        ])
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        console.error(`Analysis ${data.id} failed:`, message)
        await supabaseForTimeout
          .from('analyses')
          .update({ status: 'failed', error_message: message })
          .eq('id', data.id)
      }
    })

    return NextResponse.json({ id: data.id })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
