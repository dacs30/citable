import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ScrollToTop } from "@/components/ScrollToTop"

export default function ResultsLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        {/* URL + meta */}
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Skeleton className="h-6 w-64" />

          {/* Score gauge placeholder */}
          <Skeleton className="size-40 rounded-full" />

          <Skeleton className="h-4 w-32" />
        </div>

        {/* Tabs skeleton */}
        <div className="mb-6 flex gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
        </div>

        {/* Content card skeleton (mimics the Overview tab) */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-56" />
          </CardHeader>
          <CardContent className="space-y-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
