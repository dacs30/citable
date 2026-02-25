"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, CheckCircle2, Circle, ArrowUpCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import type { GeoScoreBreakdown } from "@/types"
import { SCORING_RUBRIC, getAchievedTier, getNextTier } from "@/lib/scoring-rubric"

function getColor(pct: number) {
  if (pct >= 80) return { bar: "#22c55e", text: "text-green-500", bg: "bg-green-500/10 border-green-500/20" }
  if (pct >= 50) return { bar: "#eab308", text: "text-yellow-500", bg: "bg-yellow-500/10 border-yellow-500/20" }
  return { bar: "#ef4444", text: "text-red-500", bg: "bg-red-500/10 border-red-500/20" }
}

export function FactorBreakdown({
  breakdown,
}: {
  breakdown: GeoScoreBreakdown
}) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const entries = Object.entries(breakdown) as [string, GeoScoreBreakdown[keyof GeoScoreBreakdown]][]

  return (
    <div className="divide-y divide-border/40">
      {entries.map(([key, factor]) => {
        const pct = Math.round((factor.score / factor.maxScore) * 100)
        const colors = getColor(pct)
        const rubric = SCORING_RUBRIC.find((r) => r.key === key)
        const isOpen = expanded === key
        const achieved = rubric ? getAchievedTier(rubric, factor.score) : null
        const next = rubric ? getNextTier(rubric, factor.score) : null

        return (
          <div key={key} className="py-4 first:pt-0 last:pb-0">
            {/* Header row — always visible */}
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : key)}
              className="flex w-full items-center gap-3 text-left"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium min-w-0 truncate">{factor.label}</span>
                  <span className={`font-mono text-xs shrink-0 ${colors.text}`}>
                    {factor.score}/{factor.maxScore}
                  </span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/40">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: colors.bar }}
                  />
                </div>
              </div>
              <div className={`ml-2 shrink-0 ${colors.text}`}>
                {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </div>
            </button>

            {/* Expandable rubric + details */}
            {isOpen && (
              <div className="mt-4 space-y-4 pl-0">
                {/* What was found */}
                <div className={`rounded-lg border px-3 py-2.5 text-sm ${colors.bg}`}>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Detected
                  </p>
                  <p className="text-foreground/80">{factor.details}</p>
                </div>

                {/* Rubric tiers */}
                {rubric && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Scoring rubric
                    </p>
                    <div className="space-y-1.5">
                      {[...rubric.tiers]
                        .sort((a, b) => b.pts - a.pts)
                        .map((tier, i) => {
                          const isAchieved = factor.score >= tier.pts
                          const isCurrentTier = achieved?.pts === tier.pts

                          return (
                            <div
                              key={i}
                              className={`flex items-start gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
                                isCurrentTier
                                  ? "bg-primary/8 border border-primary/20"
                                  : "border border-transparent"
                              }`}
                            >
                              {isAchieved ? (
                                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                              ) : (
                                <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground/40" />
                              )}
                              <span
                                className={
                                  isAchieved
                                    ? "text-foreground/90"
                                    : "text-muted-foreground/60"
                                }
                              >
                                {tier.description}
                              </span>
                              <Badge
                                variant="secondary"
                                className={`ml-auto shrink-0 font-mono text-xs ${
                                  isCurrentTier ? "bg-primary/20" : ""
                                }`}
                              >
                                {tier.pts}pt{tier.pts !== 1 ? "s" : ""}
                              </Badge>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}

                {/* Next tier improvement hint */}
                {next && (
                  <div className="flex items-start gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5 text-sm">
                    <ArrowUpCircle className="mt-0.5 size-4 shrink-0 text-blue-400" />
                    <span className="text-muted-foreground">
                      <span className="font-medium text-foreground">To reach {next.pts} pts: </span>
                      {next.description}
                    </span>
                  </div>
                )}

                {/* Tip */}
                {rubric && (
                  <p className="text-xs text-muted-foreground/70 italic">
                    Tip: {rubric.tip}
                  </p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
