import { createServerClient } from '@/lib/supabase-server'
import { scrapeWithPlaywright } from '@/lib/scrapers/playwright-scraper'
import { scrapeWithFirecrawl } from '@/lib/scrapers/firecrawl-scraper'
import { discoverSublinks } from '@/lib/link-explorer'
import { scorePageContent } from '@/lib/geo-scorer'
import type { ScrapeResult } from '@/lib/scrapers/playwright-scraper'

async function scrape(
  url: string,
  scraperType: 'playwright' | 'firecrawl',
  firecrawlApiKey?: string
): Promise<ScrapeResult> {
  if (scraperType === 'firecrawl') {
    return scrapeWithFirecrawl(url, firecrawlApiKey!)
  }
  return scrapeWithPlaywright(url)
}

async function scrapeBatch(
  urls: string[],
  scraperType: 'playwright' | 'firecrawl',
  firecrawlApiKey?: string,
  batchSize = 3
): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = []
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize)
    const settled = await Promise.allSettled(
      batch.map((u) => scrape(u, scraperType, firecrawlApiKey))
    )
    for (const result of settled) {
      if (result.status === 'fulfilled') {
        results.push(result.value)
      }
    }
  }
  return results
}

export async function runAnalysis(
  analysisId: string,
  url: string,
  scraperType: 'playwright' | 'firecrawl',
  firecrawlApiKey?: string
): Promise<void> {
  const supabase = createServerClient()

  try {
    // 1. Mark as processing
    await supabase
      .from('analyses')
      .update({ status: 'processing' })
      .eq('id', analysisId)

    // 2. Scrape homepage
    const homepage = await scrape(url, scraperType, firecrawlApiKey)
    if (homepage.error || !homepage.html) {
      await supabase
        .from('analyses')
        .update({
          status: 'failed',
          error_message: homepage.error || 'Failed to scrape homepage',
        })
        .eq('id', analysisId)
      return
    }

    // 3. Discover sublinks (returns [baseUrl, ...up to 9 sublinks])
    const allLinks = await discoverSublinks(url, homepage.html)
    // Skip re-scraping the homepage — we already have it
    const sublinks = allLinks.filter((u) => u !== url && u !== homepage.url)

    // 4. Scrape sublinks; prepend the already-scraped homepage result
    const subScraped = await scrapeBatch(sublinks, scraperType, firecrawlApiKey, 3)
    const allScraped = [homepage, ...subScraped]

    // 5. Score each successfully scraped page
    const pageRows: {
      analysis_id: string
      url: string
      score: number
      scores_breakdown: ReturnType<typeof scorePageContent>['breakdown']
      raw_content: string
    }[] = []

    for (const page of allScraped) {
      if (page.error || !page.html) continue
      const result = scorePageContent(page.html, page.url)
      pageRows.push({
        analysis_id: analysisId,
        url: page.url,
        score: result.totalScore,
        scores_breakdown: result.breakdown,
        raw_content: page.html,
      })
    }

    // 6. Insert page scores
    if (pageRows.length > 0) {
      await supabase.from('page_scores').insert(pageRows)
    }

    // 7. Calculate overall score
    const overallScore =
      pageRows.length > 0
        ? Math.round(pageRows.reduce((sum, p) => sum + p.score, 0) / pageRows.length)
        : 0

    // 8. Mark completed
    await supabase
      .from('analyses')
      .update({ status: 'completed', overall_score: overallScore })
      .eq('id', analysisId)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await supabase
      .from('analyses')
      .update({ status: 'failed', error_message: message })
      .eq('id', analysisId)
  }
}
