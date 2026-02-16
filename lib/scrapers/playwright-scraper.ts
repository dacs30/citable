import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'

export interface ScrapeResult {
  html: string
  title: string
  url: string
  error?: string
}

const LOCAL_CHROME_PATHS = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
]

async function getExecutablePath(): Promise<string> {
  // In production (Vercel/Lambda), use @sparticuz/chromium
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return await chromium.executablePath()
  }

  // Locally, use an installed Chrome browser
  const fs = await import('node:fs')
  for (const p of LOCAL_CHROME_PATHS) {
    if (fs.existsSync(p)) return p
  }

  // Fallback: try @sparticuz/chromium anyway
  return await chromium.executablePath()
}

export async function scrapeWithPlaywright(url: string): Promise<ScrapeResult> {
  const isProduction = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
  const browser = await puppeteer.launch({
    args: isProduction ? chromium.args : ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 },
    executablePath: await getExecutablePath(),
    headless: true,
  })
  try {
    const page = await browser.newPage()
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 })
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
