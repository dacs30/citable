import { UrlForm } from "@/components/UrlForm"
import { Globe, Search, BarChart3 } from "lucide-react"

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex flex-1 flex-col items-center justify-center px-6 py-20">
        {/* Subtle red gradient background */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(225,29,72,0.1)_0%,_transparent_70%)]" />

        <div className="relative flex max-w-2xl flex-col items-center gap-6 text-center">
          <h1 className="animate-fade-in-up text-4xl font-bold tracking-tight sm:text-5xl">
            Is your site AI-search ready?
          </h1>
          <p className="animate-fade-in-up animation-delay-100 max-w-lg text-lg text-foreground">
            Citable analyzes how well your website ranks in AI-generated
            answers from ChatGPT, Perplexity, and Google AI Overviews.
          </p>
          <div className="animate-fade-in-up animation-delay-200 w-full flex justify-center">
            <UrlForm />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="border-t border-border/40 bg-muted/30 px-6 py-20"
      >
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-2xl font-bold tracking-tight animate-fade-in-up">
            How it works
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            <Step
              icon={<Globe className="size-6" />}
              step={1}
              title="Enter your URL"
              description="We'll scan up to 10 pages on your site"
              delay="animation-delay-100"
            />
            <Step
              icon={<Search className="size-6" />}
              step={2}
              title="Pick your scraper"
              description="Choose a free built-in browser or your own Firecrawl key"
              delay="animation-delay-200"
            />
            <Step
              icon={<BarChart3 className="size-6" />}
              step={3}
              title="Get your score"
              description="With a detailed breakdown"
              delay="animation-delay-300"
            />
          </div>
        </div>
      </section>
    </>
  )
}

function Step({
  icon,
  step,
  title,
  description,
  delay = "",
}: {
  icon: React.ReactNode
  step: number
  title: string
  description: string
  delay?: string
}) {
  return (
    <div className={`flex flex-col items-center gap-3 text-center animate-fade-in-up ${delay}`}>
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-all duration-300 hover:bg-primary/20 hover:scale-110 animate-float">
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
