import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { UrlForm } from "@/components/UrlForm"
import { Globe, Search, BarChart3 } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between sticky top-0 z-10 border-b border-border/40 bg-background/60 px-6 py-4 backdrop-blur-md">
        <span className="text-lg font-bold tracking-tight">GEO Score</span>
        <div className="flex items-center gap-3">
          <Link
            href="/scoring"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            How it&apos;s scored
          </Link>
          <Badge variant="outline" asChild>
            <a href="#how-it-works">What is GEO?</a>
          </Badge>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-1 flex-col items-center justify-center px-6 py-20">
        {/* Subtle gradient background */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.08)_0%,_transparent_70%)]" />

        <div className="relative z-10 flex max-w-2xl flex-col items-center gap-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Is your site AI-search ready?
          </h1>
          <p className="max-w-lg text-lg text-foreground">
            GEO Score analyzes how well your website ranks in AI-generated
            answers from ChatGPT, Perplexity, and Google AI Overviews.
          </p>
          <UrlForm />
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="border-t border-border/40 bg-muted/30 px-6 py-20"
      >
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-2xl font-bold tracking-tight">
            How it works
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            <Step
              icon={<Globe className="size-6" />}
              step={1}
              title="Enter your URL"
              description="We'll scan up to 10 pages on your site"
            />
            <Step
              icon={<Search className="size-6" />}
              step={2}
              title="Pick your scraper"
              description="Headless browser or Firecrawl"
            />
            <Step
              icon={<BarChart3 className="size-6" />}
              step={3}
              title="Get your GEO Score"
              description="With a detailed breakdown"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 px-6 py-6 text-center text-sm text-muted-foreground">
        GEO Score &mdash; Built for the AI search era
        <br />
          &copy; {new Date().getFullYear()} Danilo Correia. All rights reserved.
      </footer>
    </div>
  )
}

function Step({
  icon,
  step,
  title,
  description,
}: {
  icon: React.ReactNode
  step: number
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <span className="text-xs font-medium text-muted-foreground">
        Step {step}
      </span>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
