import * as cheerio from 'cheerio'

type CheerioDoc = ReturnType<typeof cheerio.load>

export interface GeoFactor {
  score: number
  maxScore: number
  details: string
  label: string
}

export interface GeoScoreResult {
  totalScore: number
  breakdown: {
    schemaMarkup: GeoFactor
    contentStructure: GeoFactor
    metaTags: GeoFactor
    faqContent: GeoFactor
    authorEEAT: GeoFactor
    contentFreshness: GeoFactor
    internalLinking: GeoFactor
    imageAltText: GeoFactor
    aiCrawlability: GeoFactor
    answerForwardWriting: GeoFactor
  }
}

function getBodyText($: CheerioDoc): string {
  return $('body').text().replace(/\s+/g, ' ').trim()
}

function parseJsonLd($: CheerioDoc): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = []
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).html()
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        results.push(...parsed)
      } else {
        results.push(parsed)
      }
    } catch {
      // malformed JSON-LD, skip
    }
  })
  return results
}

function getSchemaTypes(jsonLdItems: Record<string, unknown>[]): string[] {
  const types: string[] = []
  for (const item of jsonLdItems) {
    if (typeof item['@type'] === 'string') {
      types.push(item['@type'])
    } else if (Array.isArray(item['@type'])) {
      types.push(...item['@type'].filter((t): t is string => typeof t === 'string'))
    }
    // Check @graph
    if (Array.isArray(item['@graph'])) {
      for (const g of item['@graph']) {
        if (typeof g === 'object' && g !== null && typeof (g as Record<string, unknown>)['@type'] === 'string') {
          types.push((g as Record<string, unknown>)['@type'] as string)
        }
      }
    }
  }
  return types
}

function scoreSchemaMarkup($: CheerioDoc): GeoFactor {
  const label = 'Schema Markup'
  try {
    const jsonLdItems = parseJsonLd($)
    const types = getSchemaTypes(jsonLdItems)
    const hasMicrodata = $('[itemtype], [itemscope]').length > 0

    const highValueTypes = ['Article', 'NewsArticle', 'FAQPage', 'HowTo', 'Product']
    const midValueTypes = ['WebPage', 'Organization', 'WebSite']

    const hasHighValue = types.some(t => highValueTypes.includes(t))
    const hasMidValue = types.some(t => midValueTypes.includes(t))

    if (hasHighValue) {
      return { score: 20, maxScore: 20, details: `Found schema types: ${types.join(', ')}`, label }
    }
    if (hasMidValue) {
      return { score: 15, maxScore: 20, details: `Found schema types: ${types.join(', ')}`, label }
    }
    if (types.length > 0) {
      return { score: 10, maxScore: 20, details: `Found JSON-LD with types: ${types.join(', ')}`, label }
    }
    if (hasMicrodata) {
      return { score: 5, maxScore: 20, details: 'Found microdata attributes but no JSON-LD', label }
    }
    return { score: 0, maxScore: 20, details: 'No structured data found', label }
  } catch {
    return { score: 0, maxScore: 20, details: 'Error parsing structured data', label }
  }
}

function scoreContentStructure($: CheerioDoc): GeoFactor {
  const label = 'Content Structure'
  try {
    const semanticTags = ['article', 'main', 'section', 'nav', 'aside', 'header', 'footer']
    const found = semanticTags.filter(tag => $(tag).length > 0)
    const hasH1 = $('h1').length > 0
    const hasH2 = $('h2').length > 0
    const paragraphCount = $('p').length

    let score = 0
    const details: string[] = []

    // Semantic tags: up to 6pts
    const semanticScore = Math.min(6, Math.round((found.length / semanticTags.length) * 6))
    score += semanticScore
    details.push(`Semantic tags: ${found.length > 0 ? found.join(', ') : 'none'}`)

    // Heading hierarchy: up to 5pts
    if (hasH1 && hasH2) {
      score += 5
      details.push('Good heading hierarchy (H1 + H2)')
    } else if (hasH1) {
      score += 3
      details.push('H1 present but no H2s')
    } else {
      details.push('Missing H1')
    }

    // Paragraph count: up to 4pts
    if (paragraphCount > 3) {
      score += 4
      details.push(`${paragraphCount} paragraphs`)
    } else if (paragraphCount > 0) {
      score += 2
      details.push(`Only ${paragraphCount} paragraph(s)`)
    } else {
      details.push('No paragraphs found')
    }

    return { score: Math.min(15, score), maxScore: 15, details: details.join('; '), label }
  } catch {
    return { score: 0, maxScore: 15, details: 'Error analyzing content structure', label }
  }
}

function scoreMetaTags($: CheerioDoc): GeoFactor {
  const label = 'Meta Tags'
  try {
    const checks: { name: string; found: boolean }[] = []

    checks.push({ name: 'title', found: $('title').length > 0 && $('title').text().trim().length > 0 })
    checks.push({ name: 'description', found: $('meta[name="description"]').length > 0 })
    checks.push({ name: 'og:title', found: $('meta[property="og:title"]').length > 0 })
    checks.push({ name: 'og:description', found: $('meta[property="og:description"]').length > 0 })
    checks.push({
      name: 'canonical',
      found: $('link[rel="canonical"]').length > 0 || $('meta[name="canonical"]').length > 0,
    })

    const foundItems = checks.filter(c => c.found)
    const score = foundItems.length * 2

    const foundNames = foundItems.map(c => c.name)
    const missingNames = checks.filter(c => !c.found).map(c => c.name)
    const details = [
      foundNames.length > 0 ? `Found: ${foundNames.join(', ')}` : '',
      missingNames.length > 0 ? `Missing: ${missingNames.join(', ')}` : '',
    ].filter(Boolean).join('; ')

    return { score, maxScore: 10, details, label }
  } catch {
    return { score: 0, maxScore: 10, details: 'Error checking meta tags', label }
  }
}

function scoreFaqContent($: CheerioDoc, schemaTypes: string[]): GeoFactor {
  const label = 'FAQ Content'
  try {
    const details: string[] = []

    // Check for FAQPage schema
    if (schemaTypes.includes('FAQPage')) {
      return { score: 10, maxScore: 10, details: 'FAQPage schema found', label }
    }

    let score = 0

    // Check for dl/dt/dd patterns
    if ($('dl dt').length > 0) {
      score = Math.max(score, 5)
      details.push('Definition list (dl/dt/dd) found')
    }

    // Check for question/answer class patterns
    const qaClasses = $('[class*="question"], [class*="answer"], [class*="faq"], [class*="accordion"]')
    if (qaClasses.length > 0) {
      score = Math.max(score, 5)
      details.push('Q&A class patterns found')
    }

    // Check headings ending with ?
    let questionHeadings = 0
    $('h2, h3, h4').each((_, el) => {
      if ($(el).text().trim().endsWith('?')) questionHeadings++
    })
    if (questionHeadings >= 2) {
      score = Math.max(score, 5)
      details.push(`${questionHeadings} question-style headings found`)
    }

    // Check for FAQ section text
    const bodyText = getBodyText($)
    if (/frequently asked questions|faq/i.test(bodyText)) {
      score = Math.max(score, 5)
      details.push('FAQ section text found')
    }

    if (details.length === 0) {
      details.push('No FAQ patterns found')
    }

    return { score, maxScore: 10, details: details.join('; '), label }
  } catch {
    return { score: 0, maxScore: 10, details: 'Error checking FAQ content', label }
  }
}

function scoreAuthorEEAT($: CheerioDoc, jsonLdItems: Record<string, unknown>[]): GeoFactor {
  const label = 'Author E-E-A-T'
  try {
    const signals: string[] = []

    // Meta tags
    if ($('meta[name="author"]').length > 0) signals.push('meta[name="author"]')
    if ($('meta[property="article:author"]').length > 0) signals.push('article:author meta')

    // Byline patterns
    if ($('[class*="author"], [class*="byline"], [class*="writer"], [id*="author"], [id*="byline"]').length > 0) {
      signals.push('Author/byline element')
    }

    // rel="author"
    if ($('a[rel="author"]').length > 0) signals.push('rel="author" link')

    // JSON-LD author
    for (const item of jsonLdItems) {
      if (item.author) signals.push('JSON-LD author property')
      if (item['@type'] === 'Person') signals.push('Person schema')
      if (Array.isArray(item['@graph'])) {
        for (const g of item['@graph']) {
          if (typeof g === 'object' && g !== null) {
            const gi = g as Record<string, unknown>
            if (gi['@type'] === 'Person') signals.push('Person schema in @graph')
            if (gi.author) signals.push('JSON-LD author in @graph')
          }
        }
      }
    }

    const unique = Array.from(new Set(signals))

    if (unique.length >= 2) {
      return { score: 10, maxScore: 10, details: `Multiple E-E-A-T signals: ${unique.join(', ')}`, label }
    }
    if (unique.length === 1) {
      return { score: 5, maxScore: 10, details: `Basic author info: ${unique[0]}`, label }
    }
    return { score: 0, maxScore: 10, details: 'No author information found', label }
  } catch {
    return { score: 0, maxScore: 10, details: 'Error checking author E-E-A-T', label }
  }
}

function scoreContentFreshness($: CheerioDoc, jsonLdItems: Record<string, unknown>[]): GeoFactor {
  const label = 'Content Freshness'
  try {
    const details: string[] = []
    let hasModified = false
    let hasPublished = false
    let hasAnyDate = false

    // JSON-LD dates
    for (const item of jsonLdItems) {
      if (item.dateModified) { hasModified = true; details.push(`dateModified: ${item.dateModified}`) }
      if (item.datePublished) { hasPublished = true; details.push(`datePublished: ${item.datePublished}`) }
      if (Array.isArray(item['@graph'])) {
        for (const g of item['@graph']) {
          if (typeof g === 'object' && g !== null) {
            const gi = g as Record<string, unknown>
            if (gi.dateModified) { hasModified = true; details.push(`dateModified: ${gi.dateModified}`) }
            if (gi.datePublished) { hasPublished = true; details.push(`datePublished: ${gi.datePublished}`) }
          }
        }
      }
    }

    // Meta dates
    const metaDate = $('meta[name="date"]').attr('content') || $('meta[property="article:published_time"]').attr('content')
    if (metaDate) { hasPublished = true; details.push(`Meta date: ${metaDate}`) }

    const metaModified = $('meta[property="article:modified_time"]').attr('content')
    if (metaModified) { hasModified = true; details.push(`Modified meta: ${metaModified}`) }

    // Time elements
    const timeEl = $('time[datetime]')
    if (timeEl.length > 0) {
      hasAnyDate = true
      details.push(`<time> element found`)
    }

    if (hasModified) return { score: 5, maxScore: 5, details: details.join('; '), label }
    if (hasPublished) return { score: 3, maxScore: 5, details: details.join('; '), label }
    if (hasAnyDate) return { score: 1, maxScore: 5, details: details.join('; '), label }

    return { score: 0, maxScore: 5, details: 'No date information found', label }
  } catch {
    return { score: 0, maxScore: 5, details: 'Error checking content freshness', label }
  }
}

function scoreInternalLinking($: CheerioDoc, pageUrl: string, schemaTypes: string[]): GeoFactor {
  const label = 'Internal Linking'
  try {
    let origin: string
    try {
      origin = new URL(pageUrl).origin
    } catch {
      origin = ''
    }

    let internalCount = 0
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href')
      if (!href) return
      // Relative links are internal
      if (!href.startsWith('http')) {
        if (!href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('javascript:')) {
          internalCount++
        }
        return
      }
      try {
        if (new URL(href).origin === origin) internalCount++
      } catch { /* skip invalid URLs */ }
    })

    const hasBreadcrumbs =
      $('nav[aria-label*="breadcrumb" i], nav[aria-label*="Breadcrumb" i], .breadcrumb, [class*="breadcrumb"]').length > 0 ||
      schemaTypes.includes('BreadcrumbList')

    const details = `${internalCount} internal links${hasBreadcrumbs ? ', breadcrumbs found' : ', no breadcrumbs'}`

    if (internalCount > 10 && hasBreadcrumbs) return { score: 5, maxScore: 5, details, label }
    if (internalCount > 5 || hasBreadcrumbs) return { score: 3, maxScore: 5, details, label }
    if (internalCount > 0) return { score: 1, maxScore: 5, details, label }
    return { score: 0, maxScore: 5, details: 'No internal links found', label }
  } catch {
    return { score: 0, maxScore: 5, details: 'Error checking internal linking', label }
  }
}

function scoreImageAltText($: CheerioDoc): GeoFactor {
  const label = 'Image Alt Text'
  try {
    const images = $('img')
    const total = images.length

    if (total === 0) {
      return { score: 5, maxScore: 5, details: 'No images on page (not penalized)', label }
    }

    let withAlt = 0
    images.each((_, el) => {
      const alt = $(el).attr('alt')
      if (alt && alt.trim().length > 0) withAlt++
    })

    const score = Math.round((withAlt / total) * 5)
    return { score, maxScore: 5, details: `${withAlt}/${total} images have alt text`, label }
  } catch {
    return { score: 0, maxScore: 5, details: 'Error checking image alt text', label }
  }
}

function scoreAiCrawlability($: CheerioDoc): GeoFactor {
  const label = 'AI Crawlability'
  try {
    const issues: string[] = []

    // Check robots meta
    const robotsContent = ($('meta[name="robots"]').attr('content') || '').toLowerCase()
    if (robotsContent.includes('noindex')) issues.push('noindex found')
    if (robotsContent.includes('noai')) issues.push('noai directive found')
    if (robotsContent.includes('noimageai')) issues.push('noimageai directive found')

    // Check for specific bot blocking
    const botMetas = ['GPTBot', 'ChatGPT-User', 'Claude-Web', 'PerplexityBot']
    for (const bot of botMetas) {
      const meta = $(`meta[name="${bot}"]`).attr('content') || ''
      if (meta.toLowerCase().includes('noindex') || meta.toLowerCase().includes('none')) {
        issues.push(`${bot} blocked`)
      }
    }

    // Check word count
    const bodyText = getBodyText($)
    const wordCount = bodyText.split(/\s+/).filter(Boolean).length
    const hasSubstantialContent = wordCount > 200

    if (!hasSubstantialContent) issues.push(`Low word count (${wordCount} words)`)

    if (issues.some(i => i.includes('noindex') || i.includes('blocked') || i.includes('noai'))) {
      return { score: 0, maxScore: 10, details: issues.join('; '), label }
    }
    if (issues.length > 0) {
      return { score: 5, maxScore: 10, details: issues.join('; '), label }
    }
    return { score: 10, maxScore: 10, details: `No blocking signals, ${wordCount} words of content`, label }
  } catch {
    return { score: 0, maxScore: 10, details: 'Error checking AI crawlability', label }
  }
}

function scoreAnswerForwardWriting($: CheerioDoc): GeoFactor {
  const label = 'Answer-Forward Writing'
  try {
    let score = 0
    const signals: string[] = []

    // Check first paragraph is substantive
    const firstP = $('p').first().text().trim()
    if (firstP.length > 80) {
      score += 3
      signals.push('Substantive opening paragraph')
    }

    // Definition lists and callout boxes
    if ($('dl, aside, blockquote').length > 0) {
      score += 2
      signals.push('Definition lists or callout boxes')
    }

    // Numbered/bullet lists
    if ($('ol li, ul li').length >= 3) {
      score += 2
      signals.push('Structured lists found')
    }

    // Word count vs heading count (dense content)
    const bodyText = getBodyText($)
    const wordCount = bodyText.split(/\s+/).filter(Boolean).length
    const headingCount = $('h1, h2, h3, h4, h5, h6').length
    if (headingCount > 0 && wordCount / headingCount > 100) {
      score += 1
      signals.push('Dense informational content')
    }

    // Definitional language
    const definitional = (bodyText.match(/\b(is|are|means|refers to|defined as)\b/gi) || []).length
    if (definitional >= 5) {
      score += 2
      signals.push(`${definitional} definitional phrases`)
    } else if (definitional >= 2) {
      score += 1
      signals.push(`${definitional} definitional phrases`)
    }

    score = Math.min(10, score)

    return {
      score,
      maxScore: 10,
      details: signals.length > 0 ? signals.join('; ') : 'No answer-forward signals found',
      label,
    }
  } catch {
    return { score: 0, maxScore: 10, details: 'Error checking answer-forward writing', label }
  }
}

export function scorePageContent(html: string, pageUrl: string): GeoScoreResult {
  const $ = cheerio.load(html)
  const jsonLdItems = parseJsonLd($)
  const schemaTypes = getSchemaTypes(jsonLdItems)

  const breakdown = {
    schemaMarkup: scoreSchemaMarkup($),
    contentStructure: scoreContentStructure($),
    metaTags: scoreMetaTags($),
    faqContent: scoreFaqContent($, schemaTypes),
    authorEEAT: scoreAuthorEEAT($, jsonLdItems),
    contentFreshness: scoreContentFreshness($, jsonLdItems),
    internalLinking: scoreInternalLinking($, pageUrl, schemaTypes),
    imageAltText: scoreImageAltText($),
    aiCrawlability: scoreAiCrawlability($),
    answerForwardWriting: scoreAnswerForwardWriting($),
  }

  const totalScore = Object.values(breakdown).reduce((sum, f) => sum + f.score, 0)

  return { totalScore, breakdown }
}
