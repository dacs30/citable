/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Browser, Page } from 'puppeteer-core'

export interface ScrapeResult {
  html: string
  title: string
  url: string
  error?: string
}

// Self-hosted Chromium binary built by scripts/postinstall.mjs into public/
const CHROMIUM_PACK_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/chromium-pack.tar`
  : undefined

// Cache the executable path so Chromium is only downloaded once per cold start
let cachedExecutablePath: string | null = null
let downloadPromise: Promise<string> | null = null

async function getChromiumPath(): Promise<string> {
  if (cachedExecutablePath) return cachedExecutablePath

  if (!downloadPromise) {
    const chromium = (await import('@sparticuz/chromium-min')).default
    downloadPromise = chromium
      .executablePath(CHROMIUM_PACK_URL)
      .then((path: string) => {
        cachedExecutablePath = path
        return path
      })
      .catch((error: Error) => {
        downloadPromise = null
        throw error
      })
  }

  return downloadPromise
}

async function launchBrowser(): Promise<Browser> {
  const isVercel = !!process.env.VERCEL_ENV

  let puppeteer: any
  let launchOptions: any = { headless: true }

  if (isVercel) {
    const chromium = (await import('@sparticuz/chromium-min')).default
    puppeteer = await import('puppeteer-core')
    const executablePath = await getChromiumPath()
    launchOptions = { ...launchOptions, args: chromium.args, executablePath }
  } else {
    puppeteer = await import('puppeteer')
  }

  return puppeteer.launch(launchOptions) as Promise<Browser>
}

async function scrapePage(browser: Browser, url: string): Promise<ScrapeResult> {
  const page: Page = await browser.newPage()
  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )

    // Block images, fonts, CSS, and media — we only need HTML for scoring
    await page.setRequestInterception(true)
    page.on('request', (req) => {
      if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
        req.abort()
      } else {
        req.continue()
      }
    })

    // domcontentloaded fires as soon as the DOM is ready — much faster than
    // networkidle2 which waits for all network activity to settle
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 })
    const html = await page.content()
    const title = await page.title()
    return { html, title, url }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { html: '', title: '', url, error: message }
  } finally {
    await page.close()
  }
}

async function scrapePages(
  browser: Browser,
  urls: string[],
  batchSize = 3
): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = []
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize)
    const settled = await Promise.allSettled(batch.map((u) => scrapePage(browser, u)))
    for (const result of settled) {
      if (result.status === 'fulfilled') results.push(result.value)
    }
  }
  return results
}

export interface BrowserSession {
  scrape: (url: string) => Promise<ScrapeResult>
  scrapeAll: (urls: string[], batchSize?: number) => Promise<ScrapeResult[]>
  close: () => Promise<void>
}

// Creates a single browser instance shared across multiple scrape calls.
// Caller is responsible for calling close() when done.
export async function createBrowserSession(): Promise<BrowserSession> {
  const browser = await launchBrowser()
  return {
    scrape: (url) => scrapePage(browser, url),
    scrapeAll: (urls, batchSize = 3) => scrapePages(browser, urls, batchSize),
    close: () => browser.close(),
  }
}

// Convenience wrapper for single-URL scraping
export async function scrapeWithPlaywright(url: string): Promise<ScrapeResult> {
  const browser = await launchBrowser()
  try {
    return await scrapePage(browser, url)
  } finally {
    await browser.close()
  }
}
