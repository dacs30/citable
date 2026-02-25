import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Footer } from "@/components/Footer"

export default function RankingsLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-4xl px-6 py-16">
        {/* Header */}
        <div className="mb-12 flex flex-col gap-3">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>

        <div className="flex flex-col gap-4">
          {/* Search bar */}
          <Skeleton className="h-10 w-full rounded-lg" />

          {/* Top 3 podium */}
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-border/50 bg-card/50">
                <CardContent className="flex flex-col items-center gap-3 pt-6 pb-5">
                  {/* Rank badge */}
                  <Skeleton className="size-8 rounded-full" />
                  {/* Score gauge */}
                  <Skeleton className="size-16 rounded-full" />
                  {/* Domain + date */}
                  <div className="flex flex-col items-center gap-1.5 w-full">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Rankings table */}
          <Card className="border-border/50 bg-card/50 overflow-hidden">
            <div className="divide-y divide-border/40">
              {/* Table header */}
              <div className="hidden items-center gap-4 px-5 py-3 sm:flex">
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-3 flex-1" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-28" />
              </div>

              {/* Table rows */}
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                  {/* Rank badge */}
                  <Skeleton className="size-8 shrink-0 rounded-full" />

                  {/* Domain */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24 sm:hidden" />
                  </div>

                  {/* Score */}
                  <Skeleton className="h-4 w-12" />

                  {/* Date */}
                  <Skeleton className="hidden h-3 w-24 sm:block" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
