"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { FactorBreakdown } from "@/components/FactorBreakdown"
import type { PageScore } from "@/types"

function shortenUrl(url: string) {
  try {
    const u = new URL(url)
    const path = u.pathname === "/" ? "/" : u.pathname
    return u.hostname + (path.length > 40 ? path.slice(0, 37) + "..." : path)
  } catch {
    return url.length > 50 ? url.slice(0, 47) + "..." : url
  }
}

function scoreBadgeVariant(score: number | null) {
  if (score === null) return "secondary" as const
  if (score >= 80) return "default" as const
  if (score >= 50) return "secondary" as const
  return "destructive" as const
}

export function PageResultsAccordion({ pages }: { pages: PageScore[] }) {
  if (pages.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No pages were analyzed.</p>
    )
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {pages.map((page) => (
        <AccordionItem key={page.id} value={page.id}>
          <AccordionTrigger className="gap-3">
            <span className="flex-1 truncate text-left font-mono text-xs">
              {shortenUrl(page.url)}
            </span>
            <Badge variant={scoreBadgeVariant(page.score)}>
              {page.score ?? "N/A"}
            </Badge>
          </AccordionTrigger>
          <AccordionContent>
            {page.scores_breakdown ? (
              <FactorBreakdown breakdown={page.scores_breakdown} />
            ) : (
              <p className="text-sm text-muted-foreground">
                No breakdown available for this page.
              </p>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
