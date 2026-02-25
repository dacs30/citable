import type { Metadata } from "next"
import { createServerClient } from "@/lib/supabase-server"
import { DomainRankingsTable } from "@/components/DomainRankingsTable"
import { RankingsSearch } from "@/components/RankingsSearch"
import { Badge } from "@/components/ui/badge"
import { Footer } from "@/components/Footer"

export const metadata: Metadata = {
  title: "Domain Rankings — Citable",
  description:
    "See how domains rank by their GEO optimization score. Compare your site against others tested on Citable.",
}

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
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const rankings = await getRankings(q)

  return (
    <div className="flex min-h-screen flex-col">
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
          <DomainRankingsTable rankings={rankings} query={q} />
        </div>
      </main>

      <Footer />
    </div>
  )
}
