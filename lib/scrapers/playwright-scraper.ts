/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Browser } from 'puppeteer-core'

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

export async function scrapeWithPlaywright(url: string): Promise<ScrapeResult> {
  let browser: Browser | undefined
  try {
    const isVercel = !!process.env.VERCEL_ENV

    let puppeteer: any
    let launchOptions: any = { headless: true }

    if (isVercel) {
      const chromium = (await import('@sparticuz/chromium-min')).default
      puppeteer = await import('puppeteer-core')
      const executablePath = await getChromiumPath()
      launchOptions = { ...launchOptions, args: chromium.args, executablePath }
    } else {
      // Locally, use full puppeteer which bundles its own Chromium
      puppeteer = await import('puppeteer')
    }

    browser = (await puppeteer.launch(launchOptions)) as Browser
    const page = await browser.newPage()
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
    const html = await page.content()
    const title = await page.title()
    return { html, title, url }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { html: '', title: '', url, error: message }
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}
