export interface RubricTier {
  pts: number
  description: string
}

export interface FactorRubric {
  key: string
  label: string
  maxScore: number
  tiers: RubricTier[]
  tip: string
}

export const SCORING_RUBRIC: FactorRubric[] = [
  {
    key: "schemaMarkup",
    label: "Schema Markup",
    maxScore: 20,
    tiers: [
      { pts: 20, description: "High-value schema present: Article, NewsArticle, FAQPage, HowTo, or Product" },
      { pts: 15, description: "Mid-value schema present: WebPage, Organization, or WebSite" },
      { pts: 10, description: "Any valid JSON-LD found on the page" },
      { pts: 5, description: "Microdata attributes (itemtype / itemscope) found, no JSON-LD" },
      { pts: 0, description: "No structured data detected" },
    ],
    tip: "Add a FAQPage schema to any page with a Q&A section — it's the highest-signal format for AI search.",
  },
  {
    key: "contentStructure",
    label: "Content Structure",
    maxScore: 15,
    tiers: [
      { pts: 15, description: "Full semantic HTML (article/main/section/nav), proper H1+H2 hierarchy, 4+ paragraphs" },
      { pts: 10, description: "Some semantic tags and headings present" },
      { pts: 5, description: "Basic heading or paragraph structure found" },
      { pts: 0, description: "No semantic structure detected" },
    ],
    tip: "Always use a single <h1> and structure subsections with <h2>. Wrap main content in <article> or <main>.",
  },
  {
    key: "metaTags",
    label: "Meta Tags",
    maxScore: 10,
    tiers: [
      { pts: 10, description: "All 5 tags present: title, description, og:title, og:description, canonical" },
      { pts: 8, description: "4 of 5 tags present" },
      { pts: 6, description: "3 of 5 tags present" },
      { pts: 4, description: "2 of 5 tags present" },
      { pts: 2, description: "1 of 5 tags present" },
      { pts: 0, description: "No meta tags found" },
    ],
    tip: "All 5 tags are table stakes. Ensure every page has a unique, descriptive title and meta description.",
  },
  {
    key: "faqContent",
    label: "FAQ / Q&A Content",
    maxScore: 10,
    tiers: [
      { pts: 10, description: "FAQPage JSON-LD schema found" },
      { pts: 5, description: "Definition lists, Q&A class patterns, question-style headings, or FAQ section text detected" },
      { pts: 0, description: "No FAQ or Q&A patterns found" },
    ],
    tip: "Add a FAQ section with a proper FAQPage schema. Even 3–5 Q&As can push AI to cite your page.",
  },
  {
    key: "authorEEAT",
    label: "Author / E-E-A-T",
    maxScore: 10,
    tiers: [
      { pts: 10, description: "Multiple E-E-A-T signals: author meta + JSON-LD Person, or author + organization info" },
      { pts: 5, description: "Basic author information: byline element, rel=author link, or meta[name=author]" },
      { pts: 0, description: "No author information found" },
    ],
    tip: "Add a JSON-LD author property with a Person schema. Link to an author bio page.",
  },
  {
    key: "contentFreshness",
    label: "Content Freshness",
    maxScore: 5,
    tiers: [
      { pts: 5, description: "dateModified found in JSON-LD or meta tags" },
      { pts: 3, description: "datePublished found in JSON-LD or meta tags" },
      { pts: 1, description: "A <time datetime> element found" },
      { pts: 0, description: "No date information detected" },
    ],
    tip: "Always include both datePublished and dateModified in your Article JSON-LD.",
  },
  {
    key: "internalLinking",
    label: "Internal Linking",
    maxScore: 5,
    tiers: [
      { pts: 5, description: "More than 10 internal links AND breadcrumb navigation present" },
      { pts: 3, description: "More than 5 internal links OR breadcrumb navigation present" },
      { pts: 1, description: "At least one internal link found" },
      { pts: 0, description: "No internal links detected" },
    ],
    tip: "Add BreadcrumbList schema and a visible breadcrumb nav on all content pages.",
  },
  {
    key: "imageAltText",
    label: "Image Alt Text",
    maxScore: 5,
    tiers: [
      { pts: 5, description: "All images have descriptive alt text, or no images on page" },
      { pts: 3, description: "Most images (60–99%) have alt text" },
      { pts: 1, description: "Some images (1–59%) have alt text" },
      { pts: 0, description: "No images have alt text" },
    ],
    tip: "Write descriptive alt text that explains what's in the image and why it's relevant.",
  },
  {
    key: "aiCrawlability",
    label: "AI Crawlability",
    maxScore: 10,
    tiers: [
      { pts: 10, description: "No blocking signals detected and page has 200+ words of content" },
      { pts: 5, description: "Minor issues only (e.g., low word count but no blocking)" },
      { pts: 0, description: "noindex, noai, noimageai directive, or AI bot blocking meta tags found" },
    ],
    tip: "Check your meta[name=\"robots\"] tag. Do NOT add \"noai\" if you want AI visibility.",
  },
  {
    key: "answerForwardWriting",
    label: "Answer-Forward Writing",
    maxScore: 10,
    tiers: [
      { pts: 10, description: "Substantive opening paragraph, definition lists, structured lists, and definitional language all present" },
      { pts: 7, description: "Multiple answer-forward signals detected" },
      { pts: 4, description: "Some answer-forward signals detected" },
      { pts: 0, description: "No answer-forward writing signals found" },
    ],
    tip: 'Start every page with a direct 1–2 sentence answer. Use bullet lists and sentences like "X is Y that does Z."',
  },
]

export function getRubricForKey(key: string): FactorRubric | undefined {
  return SCORING_RUBRIC.find((r) => r.key === key)
}

/** Returns the highest rubric tier that the given score achieves */
export function getAchievedTier(rubric: FactorRubric, score: number): RubricTier {
  const sorted = [...rubric.tiers].sort((a, b) => b.pts - a.pts)
  return sorted.find((t) => score >= t.pts) ?? sorted[sorted.length - 1]
}

/** Returns the next rubric tier above the current score, if any */
export function getNextTier(rubric: FactorRubric, score: number): RubricTier | null {
  const sorted = [...rubric.tiers].sort((a, b) => a.pts - b.pts)
  return sorted.find((t) => t.pts > score) ?? null
}
