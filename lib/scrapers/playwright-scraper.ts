import { chromium } from 'playwright'

export interface ScrapeResult {
  html: string
  title: string
  url: string
  error?: string
}

export async function scrapeWithPlaywright(url: string): Promise<ScrapeResult> {
  const browser = await chromium.launch({ headless: true })
  try {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    })
    const page = await context.newPage()
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
    const html = await page.content()
    const title = await page.title()
    return { html, title, url }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { html: '', title: '', url, error: message }
  } finally {
    await browser.close()
  }
}
