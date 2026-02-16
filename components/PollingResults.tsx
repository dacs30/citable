"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import type { AnalysisWithPages } from "@/types"

export function PollingResults({
  id,
  initialData,
}: {
  id: string
  initialData: AnalysisWithPages
}) {
  const router = useRouter()
  const [data, setData] = useState(initialData)

  useEffect(() => {
    if (data.status === "completed" || data.status === "failed") return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/results/${id}`)
        if (!res.ok) return
        const json = await res.json()
        setData(json)
        if (json.status === "completed" || json.status === "failed") {
          clearInterval(interval)
          router.refresh()
        }
      } catch {
        // silently retry on next interval
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [id, data.status, router])

  const isPending = data.status === "pending"
  const isProcessing = data.status === "processing"

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
      <Loader2 className="size-12 animate-spin text-muted-foreground" />
      <div className="text-center">
        <h2 className="text-xl font-semibold">
          {isPending ? "Queued for analysis" : "Analyzing your site"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {isPending
            ? "Your analysis will begin shortly..."
            : "Scraping pages and computing GEO scores..."}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{data.url}</p>
      </div>
      {isProcessing && data.page_scores.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {data.page_scores.length} page(s) analyzed so far
        </p>
      )}
    </div>
  )
}
