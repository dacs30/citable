import type { Metadata } from "next"
import { createServerClient } from "@/lib/supabase-server"
import { DomainRankingsTable } from "@/components/DomainRankingsTable"
import { RankingsSearch } from "@/components/RankingsSearch"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "Domain Rankings — Citable",
  description:
    "See how domains rank by their GEO optimization score. Compare your site against others tested on Citable.",
}

const PAGE_SIZE = 50

interface DomainRanking {
  id: string
  domain: string
  url: string
  overall_score: number
  created_at: string
}

async function getRankings(query?: string): Promise<DomainRanking[]> {
  const supabase = createServerClient()

  let q = supabase
    .from("analyses")
    .select("id, domain, url, overall_score, created_at")
    .eq("status", "completed")
    .not("overall_score", "is", null)
    .order("overall_score", { ascending: false })

  if (query) {
    q = q.ilike("domain", `%${query}%`)
  }

  const { data, error } = await q

  if (error || !data) return []

  // Keep only the most recent analysis per domain
  const seen = new Set<string>()
  return data.filter((row: { domain: string }) => {
    if (seen.has(row.domain)) return false
    seen.add(row.domain)
    return true
  }) as DomainRanking[]
}

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { q, page } = await searchParams
  const allRankings = await getRankings(q)

  const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1)
  const totalPages = Math.max(1, Math.ceil(allRankings.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * PAGE_SIZE
  const rankings = allRankings.slice(startIndex, startIndex + PAGE_SIZE)

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-16">
        {/* Header */}
        <div className="mb-12 flex flex-col gap-3">
          <Badge variant="outline" className="w-fit">
            Leaderboard
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight">
            Domain Rankings
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Domains ranked by their GEO optimization score. See how websites
            stack up for AI search readiness.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <RankingsSearch defaultValue={q} />
          <DomainRankingsTable
            rankings={rankings}
            query={q}
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={allRankings.length}
          />
        </div>
    </main>
  )
}
