"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { Analysis } from "@/types"

export function HistoryChart({
  pastAnalyses,
  currentScore,
}: {
  pastAnalyses: Analysis[]
  currentScore: number
}) {
  if (pastAnalyses.length <= 1) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border">
        <p className="text-sm text-muted-foreground">
          First analysis for this domain
        </p>
      </div>
    )
  }

  const data = pastAnalyses
    .filter((a) => a.overall_score !== null)
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    .map((a) => ({
      date: new Date(a.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      score: a.overall_score,
    }))

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 13, fill: "#a1a1aa" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 13, fill: "#a1a1aa" }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(240 6% 10%)",
              border: "1px solid hsl(240 4% 20%)",
              borderRadius: "8px",
              fontSize: "13px",
              color: "#e4e4e7",
            }}
            labelStyle={{ color: "#a1a1aa" }}
            itemStyle={{ color: "#e4e4e7" }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ r: 4, fill: "#22c55e" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
