import { createServerClient } from '@/lib/supabase-server'
import { createBrowserSession } from '@/lib/scrapers/playwright-scraper'
import { scrapeWithFirecrawl } from '@/lib/scrapers/firecrawl-scraper'
import { discoverSublinks } from '@/lib/link-explorer'
import { scorePageContent } from '@/lib/geo-scorer'
import type { ScrapeResult } from '@/lib/scrapers/playwright-scraper'

async function firecrawlBatch(
  urls: string[],
  apiKey: string,
  batchSize = 3
): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = []
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize)
    const settled = await Promise.allSettled(batch.map((u) => scrapeWithFirecrawl(u, apiKey)))
    for (const result of settled) {
      if (result.status === 'fulfilled') results.push(result.value)
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

    let allScraped: ScrapeResult[]

    if (scraperType === 'playwright') {
      // One browser instance for homepage + all sublinks — avoids N+1 browser launches
      const session = await createBrowserSession()
      try {
        // 2. Scrape homepage
        const homepage = await session.scrape(url)
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

        // 3. Discover sublinks, scrape them with the same browser
        const allLinks = await discoverSublinks(url, homepage.html)
        const sublinks = allLinks.filter((u) => u !== url && u !== homepage.url)
        const subScraped = await session.scrapeAll(sublinks)
        allScraped = [homepage, ...subScraped]
      } finally {
        await session.close()
      }
    } else {
      // 2. Scrape homepage via Firecrawl
      const homepage = await scrapeWithFirecrawl(url, firecrawlApiKey!)
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

      // 3. Discover sublinks and scrape in batches
      const allLinks = await discoverSublinks(url, homepage.html)
      const sublinks = allLinks.filter((u) => u !== url && u !== homepage.url)
      const subScraped = await firecrawlBatch(sublinks, firecrawlApiKey!)
      allScraped = [homepage, ...subScraped]
    }

    // 4. Score each successfully scraped page
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

    // 5. Insert page scores
    if (pageRows.length > 0) {
      await supabase.from('page_scores').insert(pageRows)
    }

    // 6. Calculate overall score
    const overallScore =
      pageRows.length > 0
        ? Math.round(pageRows.reduce((sum, p) => sum + p.score, 0) / pageRows.length)
        : 0

    // 7. Mark completed
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
