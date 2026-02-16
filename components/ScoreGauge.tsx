"use client"

interface ScoreGaugeProps {
  score: number
  size?: "sm" | "md" | "lg"
}

const sizeConfig = {
  sm: { width: 80, stroke: 6, fontSize: 20, labelSize: 10 },
  md: { width: 120, stroke: 8, fontSize: 32, labelSize: 13 },
  lg: { width: 160, stroke: 10, fontSize: 42, labelSize: 15 },
}

function getScoreColor(score: number) {
  if (score >= 80) return "#22c55e"
  if (score >= 50) return "#eab308"
  return "#ef4444"
}

function getScoreLabel(score: number) {
  if (score >= 80) return "Excellent"
  if (score >= 65) return "Good"
  if (score >= 40) return "Needs Work"
  return "Poor"
}

export function ScoreGauge({ score, size = "md" }: ScoreGaugeProps) {
  const config = sizeConfig[size]
  const radius = (config.width - config.stroke) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.max(0, Math.min(100, score)) / 100
  const dashOffset = circumference * (1 - progress)
  const color = getScoreColor(score)
  const label = getScoreLabel(score)

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        width={config.width}
        height={config.width}
        viewBox={`0 0 ${config.width} ${config.width}`}
      >
        {/* Background circle */}
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.stroke}
          className="text-muted/40"
        />
        {/* Score arc */}
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={config.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${config.width / 2} ${config.width / 2})`}
          className="transition-all duration-700 ease-out"
        />
        {/* Score number */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          fontSize={config.fontSize}
          fontWeight="bold"
        >
          {score}
        </text>
      </svg>
      <span
        className="font-medium"
        style={{ fontSize: config.labelSize, color }}
      >
        {label}
      </span>
    </div>
  )
}
