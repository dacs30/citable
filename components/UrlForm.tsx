"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export function UrlForm() {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [scraperType, setScraperType] = useState<"playwright" | "firecrawl">(
    "playwright"
  )
  const [firecrawlKey, setFirecrawlKey] = useState("")
  const [loading, setLoading] = useState(false)

  function validateUrl(value: string): boolean {
    return /^https?:\/\/.+/.test(value) || /^.+\..+/.test(value)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validateUrl(url)) {
      toast.error("Please enter a valid URL starting with http:// or https://")
      return
    }

    if (scraperType === "firecrawl" && !firecrawlKey.trim()) {
      toast.error("Please enter your Firecrawl API key")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          scraper_type: scraperType,
          ...(scraperType === "firecrawl" && {
            firecrawl_api_key: firecrawlKey,
          }),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Request failed (${res.status})`)
      }

      const data = await res.json()
      router.push(`/${data.id}`)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-xl border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg">Analyze your website</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* URL Input */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="url">Website URL</Label>
            <Input
              id="url"
              name="url"
              type="url"
              autoComplete="off"
              placeholder="https://yourwebsite.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Scraper Selector */}
          <div className="flex flex-col gap-3">
            <Label>Scraper</Label>
            <RadioGroup
              value={scraperType}
              onValueChange={(v) =>
                setScraperType(v as "playwright" | "firecrawl")
              }
              disabled={loading}
            >
              <div className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
                <RadioGroupItem value="playwright" id="playwright" className="mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor="playwright" className="cursor-pointer font-medium">
                    Playwright
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    Free headless browser — may be slower or time out on some sites
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
                <RadioGroupItem value="firecrawl" id="firecrawl" className="mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor="firecrawl" className="cursor-pointer font-medium">
                    Firecrawl
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    Faster and more reliable — requires a paid API key
                  </span>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Firecrawl API Key (animated) */}
          <div className={`grid transition-all duration-300 ease-in-out ${
            scraperType === "firecrawl"
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          }`}>
            <div className="overflow-hidden">
              <div className="flex flex-col gap-2 pb-1">
                <Label htmlFor="firecrawl-key">Firecrawl API Key</Label>
                <Input
                  id="firecrawl-key"
                  type="password"
                  placeholder="fc-xxxx"
                  value={firecrawlKey}
                  onChange={(e) => setFirecrawlKey(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <Button type="submit" size="lg" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
