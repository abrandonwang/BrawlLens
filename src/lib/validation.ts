export function sanitizePlayerTag(raw: string): string | null {
  const cleaned = raw.trim().replace(/^#/, "").toUpperCase()
  if (!/^[0289PYLQGRJCUV]{3,15}$/.test(cleaned)) return null
  return cleaned
}

export function parsePositiveInt(raw: string | null, opts: { max?: number } = {}): number | null {
  if (!raw) return null
  const n = Number(raw)
  if (!Number.isInteger(n) || n <= 0) return null
  if (opts.max !== undefined && n > opts.max) return null
  return n
}

export function parseBrawlerId(raw: string | null): number | null {
  return parsePositiveInt(raw, { max: 99_999_999 })
}

export function parseMapName(raw: string | null): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (trimmed.length === 0 || trimmed.length > 80) return null
  return trimmed
}
