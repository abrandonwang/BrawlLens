export function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return n.toString()
}

export function formatTrophies(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K"
  return n.toString()
}

export function formatBrawlerName(name: string): string {
  return name
    .split(" ")
    .map(w => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ")
}

export function formatRelativeTime(input: string | Date | null | undefined): string {
  if (!input) return ""
  const time = typeof input === "string" ? new Date(input).getTime() : input.getTime()
  if (Number.isNaN(time)) return ""
  const diff = Date.now() - time
  if (diff < 0) return "just now"
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return "just now"
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}d ago`
  const wk = Math.floor(day / 7)
  if (wk < 5) return `${wk}w ago`
  const mo = Math.floor(day / 30)
  if (mo < 12) return `${mo}mo ago`
  const yr = Math.floor(day / 365)
  return `${yr}y ago`
}

export function getPageItems(current: number, total: number): (number | "...")[] {
  const pages: (number | "...")[] = []
  for (let i = 0; i < total; i++) {
    if (i === 0 || i === total - 1 || Math.abs(i - current) <= 1) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...")
    }
  }
  return pages
}

export function normalizeMapName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "")
}
