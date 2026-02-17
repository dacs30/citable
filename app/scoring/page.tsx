import Link from "next/link"
import type { Metadata } from "next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScoreGauge } from "@/components/ScoreGauge"
import {
  Code2,
  FileText,
  Tag,
  MessageSquare,
  UserCheck,
  Clock,
  Link2,
  Image,
  Bot,
  Lightbulb,
} from "lucide-react"

export const metadata: Metadata = {
  title: "How Citable Score is Calculated — Citable",
  description:
    "Learn how Citable measures your website's readiness for AI-generated search results across 10 key factors.",
}

const factors = [
  {
    key: "schemaMarkup",
    icon: Code2,
    label: "Schema Markup",
    maxScore: 20,
    why: "AI models rely heavily on structured data to understand what a page is about. JSON-LD schemas like FAQPage, Article, and HowTo directly inform how AI systems surface your content.",
    scoring: [
      { pts: 20, desc: "High-value schema present: Article, NewsArticle, FAQPage, HowTo, or Product" },
      { pts: 15, desc: "Mid-value schema present: WebPage, Organization, or WebSite" },
      { pts: 10, desc: "Any valid JSON-LD found" },
      { pts: 5, desc: "Microdata attributes (itemtype / itemscope) found, no JSON-LD" },
      { pts: 0, desc: "No structured data detected" },
    ],
    tip: "Add a FAQPage schema to any page with a Q&A section — it's one of the highest-signal formats for AI search.",
  },
  {
    key: "contentStructure",
    icon: FileText,
    label: "Content Structure",
    maxScore: 15,
    why: "Semantic HTML helps AI crawlers parse the hierarchy and meaning of your content. A well-structured page with clear headings makes it easier to extract direct answers.",
    scoring: [
      { pts: 6, desc: "Semantic HTML tags present (article, main, section, nav, aside, header, footer) — scored proportionally" },
      { pts: 5, desc: "Proper heading hierarchy: H1 and H2+ both present" },
      { pts: 3, desc: "H1 present but no H2s" },
      { pts: 4, desc: "More than 3 paragraphs of content" },
    ],
    tip: "Always use a single <h1> and structure subsections with <h2>. Wrap your main content in <article> or <main>.",
  },
  {
    key: "metaTags",
    icon: Tag,
    label: "Meta Tags",
    maxScore: 10,
    why: "Meta tags are the first thing AI systems read when indexing a page. A clear title, description, and OG tags ensure your content is accurately represented in AI-generated summaries.",
    scoring: [
      { pts: 2, desc: "<title> tag present and non-empty" },
      { pts: 2, desc: 'meta name="description" present' },
      { pts: 2, desc: "og:title Open Graph tag present" },
      { pts: 2, desc: "og:description Open Graph tag present" },
      { pts: 2, desc: "Canonical URL defined (link[rel=canonical])" },
    ],
    tip: "All 5 tags are table stakes — missing any one of them costs 2 points. Ensure every page has a unique, descriptive title and meta description.",
  },
  {
    key: "faqContent",
    icon: MessageSquare,
    label: "FAQ / Q&A Content",
    maxScore: 10,
    why: 'AI search results love direct question-and-answer formats. Pages with FAQ sections are far more likely to be quoted verbatim in AI-generated responses as "featured answers".',
    scoring: [
      { pts: 10, desc: "FAQPage JSON-LD schema found" },
      { pts: 5, desc: "Definition lists (dl/dt/dd), Q&A class patterns, or question-style headings (ending in ?) detected" },
      { pts: 5, desc: 'FAQ section text found ("Frequently Asked Questions")' },
    ],
    tip: 'Add a FAQ section with a proper FAQPage schema. Even 3–5 Q&As can push AI assistants to cite your page for "how" and "what" queries.',
  },
  {
    key: "authorEEAT",
    icon: UserCheck,
    label: "Author / E-E-A-T",
    maxScore: 10,
    why: "Experience, Expertise, Authoritativeness, and Trustworthiness (E-E-A-T) signals help AI systems determine if your content is credible. Author information is a key trust signal.",
    scoring: [
      { pts: 10, desc: "Multiple E-E-A-T signals: author meta tags + JSON-LD Person schema, or author + organization info" },
      { pts: 5, desc: "Basic author information: byline element, rel=author link, or meta[name=author]" },
      { pts: 0, desc: "No author information found" },
    ],
    tip: 'Add a JSON-LD author property with a Person schema. Link to an author bio page. Use meta[name="author"] on all blog posts and articles.',
  },
  {
    key: "contentFreshness",
    icon: Clock,
    label: "Content Freshness",
    maxScore: 5,
    why: "AI search engines prefer up-to-date content. Explicit publication and modification dates signal that your content is current and trustworthy.",
    scoring: [
      { pts: 5, desc: "dateModified found in JSON-LD or meta tags" },
      { pts: 3, desc: "datePublished found in JSON-LD or meta tags" },
      { pts: 1, desc: "Any <time datetime> element found" },
      { pts: 0, desc: "No date information detected" },
    ],
    tip: "Always include both datePublished and dateModified in your Article JSON-LD. Update the dateModified whenever you make meaningful content changes.",
  },
  {
    key: "internalLinking",
    icon: Link2,
    label: "Internal Linking",
    maxScore: 5,
    why: "A strong internal link structure helps AI crawlers discover and understand the relationship between your pages. Breadcrumbs in particular are a strong structural signal.",
    scoring: [
      { pts: 5, desc: "More than 10 internal links AND breadcrumb navigation present" },
      { pts: 3, desc: "More than 5 internal links OR breadcrumb navigation present" },
      { pts: 1, desc: "At least one internal link found" },
      { pts: 0, desc: "No internal links detected" },
    ],
    tip: "Add BreadcrumbList schema and a visible breadcrumb nav on all content pages. Link generously to related articles and topic hubs.",
  },
  {
    key: "imageAltText",
    icon: Image,
    label: "Image Alt Text",
    maxScore: 5,
    why: "Alt text gives AI systems additional context about visual content. It also signals accessibility best practices, which correlate with content quality.",
    scoring: [
      { pts: 5, desc: "All images have descriptive alt text, or no images on page" },
      { pts: "proportional", desc: "Score = (images with alt / total images) × 5, rounded" },
    ],
    tip: "Write descriptive alt text that explains what's in the image and why it's relevant — not just a filename. Pages with no images receive full marks.",
  },
  {
    key: "aiCrawlability",
    icon: Bot,
    label: "AI Crawlability",
    maxScore: 10,
    why: "If you're blocking AI crawlers, you can't appear in AI search results — it's that simple. This factor checks for active blocking signals and whether your page has enough content to be useful.",
    scoring: [
      { pts: 10, desc: "No blocking signals detected and page has 200+ words of content" },
      { pts: 5, desc: "Minor issues only (e.g., low word count)" },
      { pts: 0, desc: "noindex, noai, noimageai meta robots directive, or AI bot blocking meta tags found" },
    ],
    tip: 'Check your meta[name="robots"] tag. Do NOT add "noai" or "noimageai" if you want AI visibility. Ensure pages have substantial written content.',
  },
  {
    key: "answerForwardWriting",
    icon: Lightbulb,
    label: "Answer-Forward Writing",
    maxScore: 10,
    why: 'AI search engines favor content that gets to the point immediately. "Answer-forward" writing — where the first paragraph directly answers the likely question — is far more likely to be surfaced in AI responses.',
    scoring: [
      { pts: 3, desc: "First paragraph is substantive (80+ characters)" },
      { pts: 2, desc: "Definition lists, asides, or blockquotes present" },
      { pts: 2, desc: "3 or more list items (ordered or unordered)" },
      { pts: 2, desc: "5 or more definitional phrases (is, are, means, refers to, defined as)" },
      { pts: 1, desc: "Dense content ratio (100+ words per heading)" },
    ],
    tip: 'Start every page with a direct 1–2 sentence answer to the question the page addresses. Use bullet lists and definition-style sentences like "X is Y that does Z."',
  },
]

const gradeTiers = [
  { score: 90, label: "Excellent", color: "text-green-500", desc: "Fully optimized for AI search" },
  { score: 70, label: "Good", color: "text-green-400", desc: "Strong foundation, minor gaps" },
  { score: 55, label: "Needs Work", color: "text-yellow-500", desc: "Several improvements needed" },
  { score: 30, label: "Poor", color: "text-red-500", desc: "Major optimization gaps" },
]

export default function ScoringPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-4xl px-6 py-16">
        {/* Header */}
        <div className="mb-12 flex flex-col gap-3">
          <Badge variant="outline" className="w-fit">Methodology</Badge>
          <h1 className="text-4xl font-bold tracking-tight">How your Citable score is calculated</h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Citable measures how well your website is structured for AI-generated search results.
            Each of the 10 factors below evaluates a specific signal that AI systems like ChatGPT,
            Perplexity, and Google AI Overviews use when deciding whether to surface your content.
          </p>
        </div>

        {/* Score tiers */}
        <section className="mb-14">
          <h2 className="mb-6 text-xl font-semibold">Score tiers</h2>
          <div className="grid gap-4 sm:grid-cols-4">
            {gradeTiers.map((tier) => (
              <Card key={tier.label} className="border-border/50 bg-card/50">
                <CardContent className="flex flex-col items-center gap-3 pt-6 pb-5">
                  <ScoreGauge score={tier.score} size="sm" />
                  <div className="text-center">
                    <p className="text-sm font-medium">{tier.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator className="mb-14" />

        {/* Total score breakdown bar */}
        <section className="mb-14">
          <h2 className="mb-6 text-xl font-semibold">Factor weights</h2>
          <div className="flex flex-col gap-2">
            {factors.map((f) => (
              <div key={f.key} className="flex items-center gap-3">
                <span className="w-48 shrink-0 text-sm text-muted-foreground">{f.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted/40">
                  <div
                    className="h-full rounded-full bg-primary/70"
                    style={{ width: `${(f.maxScore / 100) * 100}%` }}
                  />
                </div>
                <span className="w-12 shrink-0 text-right text-sm font-medium">
                  {f.maxScore} pts
                </span>
              </div>
            ))}
          </div>
        </section>

        <Separator className="mb-14" />

        {/* Factor details */}
        <section className="flex flex-col gap-10">
          <h2 className="text-xl font-semibold">Factor details</h2>
          {factors.map((factor) => {
            const Icon = factor.icon
            return (
              <Card key={factor.key} className="border-border/50 bg-card/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-4.5" />
                      </div>
                      <span>{factor.label}</span>
                    </div>
                    <Badge variant="secondary" className="shrink-0 font-mono text-xs">
                      {factor.maxScore} pts
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  {/* Why it matters */}
                  <p className="text-sm text-muted-foreground">{factor.why}</p>

                  {/* Scoring breakdown */}
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Scoring
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {factor.scoring.map((row, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm">
                          <span className="mt-0.5 w-12 shrink-0 rounded bg-muted/60 px-1.5 py-0.5 text-center font-mono text-xs">
                            {typeof row.pts === "number" ? `${row.pts}pts` : row.pts}
                          </span>
                          <span className="text-muted-foreground">{row.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tip */}
                  <div className="flex gap-2.5 rounded-lg border border-border/50 bg-muted/20 p-3 text-sm">
                    <Lightbulb className="mt-0.5 size-4 shrink-0 text-yellow-500" />
                    <span className="text-muted-foreground">{factor.tip}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </section>

        {/* Footer CTA */}
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <p className="text-muted-foreground">Ready to see how your site scores?</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Analyze your website
          </Link>
        </div>
      </main>

      <footer className="border-t border-border/40 px-6 py-6 text-center text-sm text-muted-foreground">
        Citable — Built for the AI search era
      </footer>
    </div>
  )
}
