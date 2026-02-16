import { notFound } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import { extractContentPreview } from "@/lib/content-preview"
import { PollingResults } from "@/components/PollingResults"
import { ResultsView } from "@/components/ResultsView"
import type { AnalysisWithPages, Analysis, ContentPreview } from "@/types"

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServerClient()

  const { data: analysis, error } = await supabase
    .from("analyses")
    .select("*, page_scores(*)")
    .eq("id", id)
    .single()

  if (error || !analysis) {
    notFound()
  }

  const typedAnalysis = analysis as unknown as AnalysisWithPages

  // Pending or processing: show polling view
  if (
    typedAnalysis.status === "pending" ||
    typedAnalysis.status === "processing"
  ) {
    return (
      <div className="flex min-h-screen flex-col">
        <nav className="flex items-center sticky top-0 z-10 border-b border-border/40 bg-background/60 px-6 py-4 backdrop-blur-md">
          <span className="text-lg font-bold tracking-tight">GEO Score</span>
        </nav>
        <PollingResults id={id} initialData={typedAnalysis} />
      </div>
    )
  }

  // Fetch past analyses for the same domain (for history chart)
  const { data: pastAnalyses } = await supabase
    .from("analyses")
    .select("*")
    .eq("domain", typedAnalysis.domain)
    .eq("status", "completed")
    .order("created_at", { ascending: true })

  // Extract content previews server-side (uses cheerio — keeps client bundle clean)
  const contentPreviews: ContentPreview[] = typedAnalysis.page_scores
    .filter((p) => p.raw_content)
    .map((p) => extractContentPreview(p.raw_content!, p.url))

  return (
    <ResultsView
      analysis={typedAnalysis}
      pastAnalyses={(pastAnalyses as unknown as Analysis[]) ?? []}
      contentPreviews={contentPreviews}
    />
  )
}
