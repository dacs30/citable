import * as cheerio from 'cheerio'

const EXCLUDED_PATH_PATTERNS = [
  /\/login/i,
  /\/logout/i,
  /\/signup/i,
  /\/register/i,
  /\/api\//i,
  /\/admin/i,
  /\/_next/i,
  /\/assets/i,
  /\/static/i,
  /\/cdn/i,
]

const EXCLUDED_EXTENSIONS = /\.(pdf|zip|gz|tar|jpg|jpeg|png|gif|svg|webp|ico|mp4|mp3|avi|mov|exe|dmg|apk|doc|docx|xls|xlsx|ppt|pptx)$/i

export function extractLinks(baseUrl: string, html: string): string[] {
  const origin = new URL(baseUrl).origin
  const $ = cheerio.load(html)
  const seen = new Set<string>()
  const results: string[] = []

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')
    if (!href) return

    // Skip anchors, mailto, tel, javascript
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return

    let absolute: string
    try {
      absolute = new URL(href, origin).href
    } catch {
      return
    }

    // Strip hash fragment
    const parsed = new URL(absolute)
    parsed.hash = ''
    absolute = parsed.href

    // Must be same origin
    if (parsed.origin !== origin) return

    // Exclude patterns
    if (EXCLUDED_PATH_PATTERNS.some(p => p.test(parsed.pathname))) return

    // Exclude file extensions
    if (EXCLUDED_EXTENSIONS.test(parsed.pathname)) return

    // Exclude the base URL itself
    const normalizedBase = new URL(baseUrl).href
    if (absolute === normalizedBase) return

    // Deduplicate
    if (seen.has(absolute)) return
    seen.add(absolute)

    results.push(absolute)
  })

  return results.slice(0, 10)
}

export async function discoverSublinks(baseUrl: string, html: string): Promise<string[]> {
  const links = extractLinks(baseUrl, html)
  return [baseUrl, ...links.slice(0, 9)]
}
