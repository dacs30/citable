/**
 * In-memory sliding-window rate limiter.
 * Limits each IP to a fixed number of requests per time window.
 *
 * Note: This works per-process. In a multi-instance deployment (e.g.
 * serverless), consider a shared store like Redis or Upstash instead.
 */

const MAX_REQUESTS = 5
const WINDOW_MS = 60_000 // 1 minute

interface WindowEntry {
  timestamps: number[]
}

const store = new Map<string, WindowEntry>()

// Periodically clean up stale entries to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60_000
setInterval(() => {
  const cutoff = Date.now() - WINDOW_MS
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff)
    if (entry.timestamps.length === 0) {
      store.delete(key)
    }
  }
}, CLEANUP_INTERVAL_MS).unref()

export interface RateLimitResult {
  allowed: boolean
  retryAfterSeconds: number
}

export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now()
  const cutoff = now - WINDOW_MS

  let entry = store.get(ip)
  if (!entry) {
    entry = { timestamps: [] }
    store.set(ip, entry)
  }

  // Drop timestamps outside the current window
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff)

  if (entry.timestamps.length >= MAX_REQUESTS) {
    const oldestInWindow = entry.timestamps[0]
    const retryAfterMs = oldestInWindow + WINDOW_MS - now
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    }
  }

  entry.timestamps.push(now)
  return { allowed: true, retryAfterSeconds: 0 }
}
