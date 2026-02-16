import * as cheerio from 'cheerio'

export interface SchemaEntry {
  type: string
  json: string
}

export interface HeadingEntry {
  level: number
  text: string
}

export interface ContentPreview {
  pageUrl: string
  title: string | null
  metaDescription: string | null
  ogTitle: string | null
  ogDescription: string | null
  canonicalUrl: string | null
  robotsMeta: string | null
  schemas: SchemaEntry[]
  headings: HeadingEntry[]
  textExcerpt: string
  wordCount: number
  imageCount: number
  imagesWithAlt: number
  internalLinkCount: number
}

export function extractContentPreview(html: string, pageUrl: string): ContentPreview {
  const $ = cheerio.load(html)

  // Basic meta
  const title = $('title').first().text().trim() || null
  const metaDescription = $('meta[name="description"]').attr('content')?.trim() || null
  const ogTitle = $('meta[property="og:title"]').attr('content')?.trim() || null
  const ogDescription = $('meta[property="og:description"]').attr('content')?.trim() || null
  const canonicalUrl = $('link[rel="canonical"]').attr('href')?.trim() || null
  const robotsMeta = $('meta[name="robots"]').attr('content')?.trim() || null

  // JSON-LD schemas
  const schemas: SchemaEntry[] = []
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).html()
      if (!raw) return
      const parsed = JSON.parse(raw)
      const items = Array.isArray(parsed) ? parsed : [parsed]
      for (const item of items) {
        const types: string[] = []
        if (typeof item['@type'] === 'string') types.push(item['@type'])
        else if (Array.isArray(item['@type'])) types.push(...item['@type'])
        if (Array.isArray(item['@graph'])) {
          for (const g of item['@graph']) {
            if (typeof g?.['@type'] === 'string') types.push(g['@type'])
          }
        }
        schemas.push({
          type: types.join(', ') || 'Unknown',
          json: JSON.stringify(item, null, 2),
        })
      }
    } catch {
      // skip malformed
    }
  })

  // Heading tree (max 20 headings)
  const headings: HeadingEntry[] = []
  $('h1, h2, h3, h4').each((_, el) => {
    if (headings.length >= 20) return
    const tagName = $(el).prop('tagName')?.toLowerCase() ?? ''
    const level = parseInt(tagName.slice(1), 10)
    if (!level) return
    const text = $(el).text().trim().slice(0, 120)
    if (text) headings.push({ level, text })
  })

  // Text content — strip scripts/styles first, get clean body text
  $('script, style, noscript').remove()
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim()
  const words = bodyText.split(' ').filter(Boolean)
  const wordCount = words.length
  const textExcerpt = words.slice(0, 120).join(' ')

  // Images
  const images = $('img')
  const imageCount = images.length
  let imagesWithAlt = 0
  images.each((_, el) => {
    const alt = $(el).attr('alt')
    if (alt && alt.trim().length > 0) imagesWithAlt++
  })

  // Internal links
  let internalLinkCount = 0
  try {
    const origin = new URL(pageUrl).origin
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href')
      if (!href) return
      if (!href.startsWith('http')) {
        if (!href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('javascript:')) {
          internalLinkCount++
        }
        return
      }
      try {
        if (new URL(href).origin === origin) internalLinkCount++
      } catch { /* skip */ }
    })
  } catch { /* skip if pageUrl is invalid */ }

  return {
    pageUrl,
    title,
    metaDescription,
    ogTitle,
    ogDescription,
    canonicalUrl,
    robotsMeta,
    schemas,
    headings,
    textExcerpt,
    wordCount,
    imageCount,
    imagesWithAlt,
    internalLinkCount,
  }
}
