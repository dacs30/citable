"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScoreGauge } from "@/components/ScoreGauge"
import { FactorBreakdown } from "@/components/FactorBreakdown"
import { PageResultsAccordion } from "@/components/PageResultsAccordion"
import { HistoryChart } from "@/components/HistoryChart"
import { ContentSnapshot } from "@/components/ContentSnapshot"
import type { AnalysisWithPages, Analysis, GeoScoreBreakdown, GeoFactor, ContentPreview } from "@/types"

function averageBreakdowns(
  pages: AnalysisWithPages["page_scores"]
): GeoScoreBreakdown | null {
  const scored = pages.filter((p) => p.scores_breakdown !== null)
  if (scored.length === 0) return null

  const keys = Object.keys(scored[0]!.scores_breakdown!) as (keyof GeoScoreBreakdown)[]
  const result = {} as Record<keyof GeoScoreBreakdown, GeoFactor>

  for (const key of keys) {
    const factors = scored.map((p) => p.scores_breakdown![key])
    result[key] = {
      score: Math.round(
        factors.reduce((sum, f) => sum + f.score, 0) / factors.length
      ),
      maxScore: factors[0].maxScore,
      label: factors[0].label,
      details: factors[0].details,
    }
  }

  return result as GeoScoreBreakdown
}

export function ResultsView({
  analysis,
  pastAnalyses,
  contentPreviews,
}: {
  analysis: AnalysisWithPages
  pastAnalyses: Analysis[]
  contentPreviews: ContentPreview[]
}) {
  const score = analysis.overall_score ?? 0
  const avgBreakdown = averageBreakdowns(analysis.page_scores)

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        {/* URL + meta */}
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-medium break-all">{analysis.url}</h1>
            <Badge variant="outline" className="shrink-0">
              {analysis.scraper_type}
            </Badge>
          </div>

          {/* Score gauge */}
          <ScoreGauge score={score} size="lg" />

          <p className="text-sm text-muted-foreground">
            Analyzed {analysis.page_scores.length} page
            {analysis.page_scores.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Failed state */}
        {analysis.status === "failed" && (
          <Card className="mb-8 border-destructive/50">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">
                {analysis.error_message ?? "Analysis failed. Please try again."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pages">Per Page</TabsTrigger>
            <TabsTrigger value="content">What AI Sees</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Factor Breakdown (Average)</CardTitle>
              </CardHeader>
              <CardContent>
                {avgBreakdown ? (
                  <FactorBreakdown breakdown={avgBreakdown} />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No breakdown data available.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pages">
            <Card>
              <CardHeader>
                <CardTitle>Per-Page Results</CardTitle>
              </CardHeader>
              <CardContent>
                <PageResultsAccordion pages={analysis.page_scores} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>What the AI Sees</CardTitle>
              </CardHeader>
              <CardContent>
                {contentPreviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Content snapshots are not available for this analysis.
                  </p>
                ) : (
                  <ContentSnapshot previews={contentPreviews} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Score History &mdash; {analysis.domain}</CardTitle>
              </CardHeader>
              <CardContent>
                <HistoryChart
                  pastAnalyses={pastAnalyses}
                  currentScore={score}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
