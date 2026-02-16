# GEO Score

Analyze how well your website is optimized for AI-powered search engines like ChatGPT, Perplexity, and Google AI Overviews.

## What is GEO?

**Generative Engine Optimization (GEO)** is the practice of structuring your website so that AI search engines can easily find, understand, and cite your content. Traditional SEO focuses on ranking in link-based search results. GEO focuses on making your content the answer that AI models pull from.

## Why did I build this?

I built GEO Score to help website owners understand how their content is being interpreted by AI search engines and identify opportunities to improve. As AI-generated answers become more prevalent, optimizing for these platforms is crucial to maintain visibility and traffic.

Also, there are some really interesting technical challenges around scraping, content analysis, and scoring algorithms that I wanted to explore.

## How it works

1. Enter a URL
2. GEO Score scrapes the homepage and up to 9 internal pages
3. Each page is scored across 10 factors (out of 100)
4. Results are saved so you can track improvements over time

## Scoring factors

| Factor | Max | What it measures |
|---|---|---|
| Schema Markup | 20 | JSON-LD structured data (Article, FAQPage, HowTo, Product, etc.) |
| Content Structure | 15 | Semantic HTML (`<article>`, `<main>`, `<section>`), heading hierarchy |
| Meta Tags | 10 | title, description, Open Graph tags, canonical URL |
| FAQ / Q&A Content | 10 | FAQPage schema, question-style headings, Q&A patterns |
| Author / E-E-A-T | 10 | Author metadata, Person schema, bylines |
| AI Crawlability | 10 | No blocking directives (noai, noindex), sufficient word count |
| Answer-Forward Writing | 10 | Direct opening answers, definition patterns, structured lists |
| Content Freshness | 5 | datePublished / dateModified in JSON-LD or meta tags |
| Internal Linking | 5 | Internal link count, breadcrumb navigation |
| Image Alt Text | 5 | Percentage of images with descriptive alt attributes |

## Setup

```bash
npm install
```

Create a `.env.local` file with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Set up the database by running the schema in `supabase/schema.sql` against your Supabase project.

```bash
npm run dev
```

## Scrapers

- **Playwright** (default) — headless browser, no API key needed
- **Firecrawl** — faster cloud-based scraper, requires a Firecrawl API key (entered per-request, never stored)

## Tech stack

Next.js 16, TypeScript, Supabase (Postgres), Tailwind CSS, shadcn/ui, Playwright, Cheerio
