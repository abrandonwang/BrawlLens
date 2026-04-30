import { NextResponse } from "next/server"
import { HYPERCHARGES, type HyperchargeData } from "@/data/hypercharges"

type LiveHypercharge = Partial<HyperchargeData> & {
  brawlerId?: number
  brawler_id?: number
  id?: number
}

function normalizeLivePayload(payload: unknown): Record<number, HyperchargeData> | null {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { list?: unknown[] })?.list)
      ? (payload as { list: unknown[] }).list
      : Array.isArray((payload as { items?: unknown[] })?.items)
        ? (payload as { items: unknown[] }).items
        : null

  if (!list) return null

  const records: Record<number, HyperchargeData> = {}
  for (const item of list as LiveHypercharge[]) {
    const id = Number(item.brawlerId ?? item.brawler_id ?? item.id)
    if (!Number.isFinite(id) || !item.name || !item.description) continue
    records[id] = {
      name: item.name,
      description: item.description,
      damageBoost: Number(item.damageBoost ?? 5),
      shieldBoost: Number(item.shieldBoost ?? 5),
      speedBoost: Number(item.speedBoost ?? 20),
    }
  }

  return Object.keys(records).length ? records : null
}

export async function GET() {
  const sourceUrl = process.env.HYPERCHARGE_SOURCE_URL

  if (sourceUrl) {
    try {
      const response = await fetch(sourceUrl, { next: { revalidate: 3600 } })
      if (response.ok) {
        const live = normalizeLivePayload(await response.json())
        if (live) {
          const res = NextResponse.json({ hypercharges: live, source: "live" })
          res.headers.set("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400")
          return res
        }
      }
    } catch {
      // Fall through to the bundled data so the page stays useful if the source is down.
    }
  }

  const res = NextResponse.json({ hypercharges: HYPERCHARGES, source: "bundled" })
  res.headers.set("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400")
  return res
}
