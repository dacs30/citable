import Link from "next/link"
import { Trophy, Medal, Award, ExternalLink, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
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

function buildPageHref(page: number, query?: string) {
  const params = new URLSearchParams()
  if (query) params.set("q", query)
  if (page > 1) params.set("page", String(page))
  const qs = params.toString()
  return `/rankings${qs ? `?${qs}` : ""}`
}

function getVisiblePages(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | "ellipsis")[] = [1]

  if (current > 3) pages.push("ellipsis")

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push("ellipsis")

  pages.push(total)
  return pages
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
  query,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
}: {
  rankings: DomainRanking[]
  query?: string
  currentPage?: number
  totalPages?: number
  totalItems?: number
}) {
  const rankOffset = (currentPage - 1) * 50
  if (rankings.length === 0 && !query) {
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
      {/* Top 3 podium — only on first page, hidden while searching */}
      {!query && currentPage === 1 && rankings.length >= 3 && (
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

          {rankings.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Search className="size-8 text-muted-foreground/40" />
              <p className="text-sm font-medium">No results for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-muted-foreground">Try a different domain name.</p>
            </div>
          ) : (
            rankings.map((entry, i) => (
              <Link
                key={entry.id}
                href={`/${entry.id}`}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/20 group"
              >
                {/* Rank */}
                <div className="w-10 flex justify-center">
                  <RankBadge rank={rankOffset + i + 1} />
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
            ))
          )}
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            Showing {rankOffset + 1}–{rankOffset + rankings.length} of{" "}
            {totalItems} domains
          </p>

          <div className="flex items-center gap-1">
            {/* Previous */}
            {currentPage > 1 ? (
              <Link
                href={buildPageHref(currentPage - 1, query)}
                className="inline-flex size-8 items-center justify-center rounded-md text-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
              </Link>
            ) : (
              <span className="inline-flex size-8 items-center justify-center rounded-md text-sm text-muted-foreground/40">
                <ChevronLeft className="size-4" />
              </span>
            )}

            {/* Page numbers */}
            {getVisiblePages(currentPage, totalPages).map((p, i) =>
              p === "ellipsis" ? (
                <span
                  key={`ellipsis-${i}`}
                  className="inline-flex size-8 items-center justify-center text-xs text-muted-foreground"
                >
                  &hellip;
                </span>
              ) : (
                <Link
                  key={p}
                  href={buildPageHref(p, query)}
                  className={`inline-flex size-8 items-center justify-center rounded-md text-sm font-medium transition-colors ${
                    p === currentPage
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  }`}
                >
                  {p}
                </Link>
              )
            )}

            {/* Next */}
            {currentPage < totalPages ? (
              <Link
                href={buildPageHref(currentPage + 1, query)}
                className="inline-flex size-8 items-center justify-center rounded-md text-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                aria-label="Next page"
              >
                <ChevronRight className="size-4" />
              </Link>
            ) : (
              <span className="inline-flex size-8 items-center justify-center rounded-md text-sm text-muted-foreground/40">
                <ChevronRight className="size-4" />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
