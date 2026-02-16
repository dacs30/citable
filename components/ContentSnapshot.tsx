"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { ContentPreview } from "@/lib/content-preview"

function MetaRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex gap-3 py-1.5 text-sm">
      <span className="w-36 shrink-0 text-muted-foreground">{label}</span>
      {value ? (
        <span className="break-all text-foreground/90">{value}</span>
      ) : (
        <span className="text-red-400/80 italic">Missing</span>
      )}
    </div>
  )
}

function SchemaBlock({ schema }: { schema: { type: string; json: string } }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">{schema.type}</Badge>
          <span className="text-muted-foreground text-xs">JSON-LD</span>
        </div>
        {open ? <ChevronUp className="size-3.5 text-muted-foreground" /> : <ChevronDown className="size-3.5 text-muted-foreground" />}
      </button>
      {open && (
        <pre className="overflow-x-auto bg-muted/20 px-4 py-3 text-xs text-foreground/80 font-mono border-t border-border/50 max-h-64">
          {schema.json}
        </pre>
      )}
    </div>
  )
}

function HeadingTree({ headings }: { headings: { level: number; text: string }[] }) {
  if (headings.length === 0) {
    return <p className="text-sm text-muted-foreground italic">No headings found</p>
  }
  return (
    <div className="space-y-1">
      {headings.map((h, i) => (
        <div
          key={i}
          className="flex items-baseline gap-2 text-sm"
          style={{ paddingLeft: `${(h.level - 1) * 16}px` }}
        >
          <span className="shrink-0 font-mono text-xs text-muted-foreground/60 w-6">
            H{h.level}
          </span>
          <span className="text-foreground/80 truncate">{h.text}</span>
        </div>
      ))}
    </div>
  )
}

export function ContentSnapshot({ previews }: { previews: ContentPreview[] }) {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const page = previews[selectedIdx]

  if (!page) return null

  return (
    <div className="space-y-5">
      {/* Page selector if multiple pages */}
      {previews.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {previews.map((p, i) => {
            let label: string
            try {
              const u = new URL(p.pageUrl)
              label = u.pathname === "/" ? u.hostname : u.pathname
            } catch {
              label = p.pageUrl
            }
            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedIdx(i)}
                className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                  i === selectedIdx
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                {label.length > 40 ? label.slice(0, 37) + "…" : label}
              </button>
            )
          })}
        </div>
      )}

      {/* Page URL */}
      <a
        href={page.pageUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors break-all"
      >
        {page.pageUrl}
        <ExternalLink className="size-3 shrink-0" />
      </a>

      <Separator />

      {/* Meta signals */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Meta signals
        </p>
        <div className="divide-y divide-border/30 rounded-lg border border-border/50 px-3">
          <MetaRow label="Title" value={page.title} />
          <MetaRow label="Description" value={page.metaDescription} />
          <MetaRow label="OG Title" value={page.ogTitle} />
          <MetaRow label="OG Description" value={page.ogDescription} />
          <MetaRow label="Canonical URL" value={page.canonicalUrl} />
          <MetaRow label="Robots meta" value={page.robotsMeta ?? "Not set (crawlable)"} />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Word count", value: page.wordCount.toLocaleString() },
          { label: "Images", value: `${page.imagesWithAlt}/${page.imageCount} with alt` },
          { label: "Internal links", value: page.internalLinkCount.toString() },
          { label: "Schemas", value: page.schemas.length.toString() },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5"
          >
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="mt-0.5 text-sm font-medium">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Schema markup */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Structured data ({page.schemas.length} schema{page.schemas.length !== 1 ? "s" : ""})
        </p>
        {page.schemas.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No JSON-LD schemas found</p>
        ) : (
          <div className="space-y-2">
            {page.schemas.map((s, i) => (
              <SchemaBlock key={i} schema={s} />
            ))}
          </div>
        )}
      </div>

      {/* Heading structure */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Heading structure
        </p>
        <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-3">
          <HeadingTree headings={page.headings} />
        </div>
      </div>

      {/* Text excerpt */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Text content ({page.wordCount.toLocaleString()} words — first 120 shown)
        </p>
        <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-3 text-sm text-foreground/70 leading-relaxed">
          {page.textExcerpt || <span className="italic text-muted-foreground">No text content extracted</span>}
          {page.wordCount > 120 && <span className="text-muted-foreground/50">…</span>}
        </div>
      </div>
    </div>
  )
}
