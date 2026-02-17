"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft, Copy, Check, RotateCcw, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const pathname = usePathname()
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isHome = pathname === "/"
  const isScoring = pathname === "/scoring"
  const isRankings = pathname === "/rankings"
  const isResults = !isHome && !isScoring && !isRankings

  return (
    <nav className="flex items-center justify-between sticky top-0 z-50 border-b border-border/40 bg-background/60 px-6 py-4 backdrop-blur-md">
      {/* Logo */}
      {isHome && (
        <span className="text-lg font-bold tracking-tight">Citable</span>
      )}
      {(isScoring || isRankings) && (
        <Link
          href="/"
          className="text-lg font-bold tracking-tight hover:opacity-80 transition-opacity"
        >
          Citable
        </Link>
      )}
      {isResults && (
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span className="text-lg font-bold tracking-tight text-foreground">Citable</span>
        </Link>
      )}

      {/* Right side */}
      {isHome && (
        <div className="flex items-center gap-3">
          <Link
            href="/rankings"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Trophy className="size-3.5" />
            Rankings
          </Link>
          <Link
            href="/scoring"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            How it&apos;s scored
          </Link>
          <Badge variant="outline" asChild>
            <a href="#how-it-works">What is GEO?</a>
          </Badge>
        </div>
      )}

      {isScoring && (
        <div className="flex items-center gap-3">
          <Link
            href="/rankings"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Trophy className="size-3.5" />
            Rankings
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Back to analyzer
          </Link>
        </div>
      )}

      {isRankings && (
        <div className="flex items-center gap-3">
          <Link
            href="/scoring"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            How it&apos;s scored
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Back to analyzer
          </Link>
        </div>
      )}

      {isResults && (
        <div className="flex items-center gap-3">
          <Link
            href="/rankings"
            className="hidden items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors sm:flex"
          >
            <Trophy className="size-3.5" />
            Rankings
          </Link>
          <Link
            href="/scoring"
            className="hidden text-sm text-muted-foreground hover:text-foreground transition-colors sm:block"
          >
            How it&apos;s scored
          </Link>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Share"}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <RotateCcw className="size-3.5" />
              Analyze again
            </Link>
          </Button>
        </div>
      )}
    </nav>
  )
}
