import { lookup } from 'node:dns/promises'

/**
 * SSRF-safe URL validation.
 * Blocks requests to private networks, localhost, cloud metadata endpoints,
 * and link-local addresses. Resolves hostnames to IPs to prevent DNS rebinding.
 */

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
])

// CIDRs and exact ranges are checked numerically below;
// these are the human-readable descriptions:
// 127.0.0.0/8        — loopback
// 10.0.0.0/8         — private class A
// 172.16.0.0/12      — private class B
// 192.168.0.0/16     — private class C
// 169.254.0.0/16     — link-local / cloud metadata
// 0.0.0.0/8          — "this" network
// 100.64.0.0/10      — carrier-grade NAT (shared address space)
// 192.0.0.0/24       — IETF protocol assignments
// 192.0.2.0/24       — TEST-NET-1
// 198.51.100.0/24    — TEST-NET-2
// 203.0.113.0/24     — TEST-NET-3
// 224.0.0.0/4        — multicast
// 240.0.0.0/4        — reserved

function ipToNumber(ip: string): number {
  const parts = ip.split('.').map(Number)
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0
}

function isInCidr(ip: number, base: string, prefix: number): boolean {
  const baseNum = ipToNumber(base)
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0
  return (ip & mask) === (baseNum & mask)
}

const BLOCKED_CIDRS: [string, number][] = [
  ['127.0.0.0', 8],
  ['10.0.0.0', 8],
  ['172.16.0.0', 12],
  ['192.168.0.0', 16],
  ['169.254.0.0', 16],
  ['0.0.0.0', 8],
  ['100.64.0.0', 10],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
]

function isBlockedIPv4(ip: string): boolean {
  const num = ipToNumber(ip)
  return BLOCKED_CIDRS.some(([base, prefix]) => isInCidr(num, base, prefix))
}

function isBlockedIPv6(ip: string): boolean {
  // Block loopback (::1) and all non-global-unicast IPv6 by checking prefix
  const normalized = ip.toLowerCase()
  if (normalized === '::1') return true
  // fc00::/7 — unique local
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true
  // fe80::/10 — link-local
  if (normalized.startsWith('fe80')) return true
  // ff00::/8 — multicast
  if (normalized.startsWith('ff')) return true
  // :: — unspecified
  if (normalized === '::') return true
  return false
}

export interface UrlValidationResult {
  valid: boolean
  error?: string
  normalizedUrl?: string
}

export async function validateUrlForScraping(rawUrl: string): Promise<UrlValidationResult> {
  // Normalize
  let urlStr = rawUrl.trim()
  if (!/^https?:\/\//i.test(urlStr)) {
    urlStr = `https://${urlStr}`
  }

  let parsed: URL
  try {
    parsed = new URL(urlStr)
  } catch {
    return { valid: false, error: 'Invalid URL' }
  }

  // Only allow http(s)
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'Only HTTP and HTTPS URLs are allowed' }
  }

  const hostname = parsed.hostname

  // Block known dangerous hostnames
  if (BLOCKED_HOSTNAMES.has(hostname.toLowerCase())) {
    return { valid: false, error: 'This URL targets a restricted host' }
  }

  // If the hostname is already an IP literal, validate it directly
  const ipv4Regex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/
  const ipv6Regex = /^\[?([0-9a-fA-F:]+)\]?$/

  if (ipv4Regex.test(hostname)) {
    if (isBlockedIPv4(hostname)) {
      return { valid: false, error: 'This URL targets a restricted IP address' }
    }
    return { valid: true, normalizedUrl: urlStr }
  }

  const ipv6Match = hostname.match(ipv6Regex)
  if (ipv6Match) {
    if (isBlockedIPv6(ipv6Match[1])) {
      return { valid: false, error: 'This URL targets a restricted IP address' }
    }
    return { valid: true, normalizedUrl: urlStr }
  }

  // Resolve hostname to IP and validate the resolved address
  try {
    const { address, family } = await lookup(hostname)
    if (family === 4 && isBlockedIPv4(address)) {
      return { valid: false, error: 'This URL resolves to a restricted IP address' }
    }
    if (family === 6 && isBlockedIPv6(address)) {
      return { valid: false, error: 'This URL resolves to a restricted IP address' }
    }
  } catch {
    return { valid: false, error: 'Could not resolve hostname' }
  }

  return { valid: true, normalizedUrl: urlStr }
}
