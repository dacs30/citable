"use client"

import { useState } from "react"
import Link from "next/link"
import { Trophy, Medal, Award, ExternalLink, Search, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScoreGauge } from "@/components/ScoreGauge"

interface DomainRanking {
  id: string
  domain: string
  url: string
  overall_score: number
  created_at: string
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <div className="flex size-8 items-center justify-center rounded-full bg-yellow-500/15 text-yellow-500">
        <Trophy className="size-4" />
      </div>
    )
  if (rank === 2)
    return (
      <div className="flex size-8 items-center justify-center rounded-full bg-slate-300/15 text-slate-300">
        <Medal className="size-4" />
      </div>
    )
  if (rank === 3)
    return (
      <div className="flex size-8 items-center justify-center rounded-full bg-amber-600/15 text-amber-600">
        <Award className="size-4" />
      </div>
    )
  return (
    <div className="flex size-8 items-center justify-center rounded-full bg-muted/40 text-muted-foreground">
      <span className="text-xs font-semibold">{rank}</span>
    </div>
  )
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-green-500"
  if (score >= 50) return "text-yellow-500"
  return "text-red-500"
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function DomainRankingsTable({
  rankings,
}: {
  rankings: DomainRanking[]
}) {
  const [query, setQuery] = useState("")

  const filtered = query.trim()
    ? rankings.filter((r) =>
        r.domain.toLowerCase().includes(query.trim().toLowerCase())
      )
    : rankings

  if (rankings.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="flex flex-col items-center gap-4 py-16">
          <Trophy className="size-10 text-muted-foreground/40" />
          <div className="text-center">
            <p className="text-lg font-medium">No domains ranked yet</p>
            <p className="text-sm text-muted-foreground">
              Analyze a website to see it appear in the rankings.
            </p>
          </div>
          <Link
            href="/"
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Analyze a website
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search domains…"
          className="pl-9 pr-9 h-10"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Top 3 podium — only shown when not searching */}
      {!query && rankings.length >= 3 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {rankings.slice(0, 3).map((entry, i) => (
            <Link key={entry.id} href={`/${entry.id}`} className="group">
              <Card
                className={`border-border/50 bg-card/50 transition-colors group-hover:border-border/80 ${
                  i === 0 ? "sm:order-2" : i === 1 ? "sm:order-1" : "sm:order-3"
                }`}
              >
                <CardContent className="flex flex-col items-center gap-3 pt-6 pb-5">
                  <RankBadge rank={i + 1} />
                  <ScoreGauge score={entry.overall_score} size="sm" />
                  <div className="text-center">
                    <p className="text-sm font-semibold group-hover:underline">
                      {entry.domain}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(entry.created_at)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Full list */}
      <Card className="border-border/50 bg-card/50 overflow-hidden">
        <div className="divide-y divide-border/40">
          {/* Header */}
          <div className="hidden items-center gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:flex">
            <span className="w-10 text-center">Rank</span>
            <span className="flex-1">Domain</span>
            <span className="w-20 text-center">Score</span>
            <span className="w-28 text-right">Last tested</span>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Search className="size-8 text-muted-foreground/40" />
              <p className="text-sm font-medium">No results for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-muted-foreground">Try a different domain name.</p>
            </div>
          ) : (
            filtered.map((entry) => {
              const rank = rankings.indexOf(entry) + 1
              return (
                <Link
                  key={entry.id}
                  href={`/${entry.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/20 group"
                >
                  {/* Rank */}
                  <div className="w-10 flex justify-center">
                    <RankBadge rank={rank} />
                  </div>

                  {/* Domain */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:underline">
                      {entry.domain}
                    </p>
                    <p className="text-xs text-muted-foreground truncate sm:hidden">
                      {formatDate(entry.created_at)}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="w-20 flex justify-center">
                    <span
                      className={`text-sm font-bold tabular-nums ${getScoreColor(
                        entry.overall_score
                      )}`}
                    >
                      {entry.overall_score}
                      <span className="text-xs font-normal text-muted-foreground">
                        /100
                      </span>
                    </span>
                  </div>

                  {/* Date */}
                  <div className="hidden w-28 text-right sm:flex items-center justify-end gap-1.5">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(entry.created_at)}
                    </span>
                    <ExternalLink className="size-3 text-muted-foreground/50" />
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </Card>
    </div>
  )
}
