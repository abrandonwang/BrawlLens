import type { Metadata } from "next"
import { Suspense } from "react"
import BrawlerPageClient from "./BrawlerPageClient"

export const metadata: Metadata = {
  title: "Brawlers | BrawlLens",
  description: "Browse every Brawl Stars brawler with rarity, class, abilities, hypercharges, win rates, and best maps from real battle data.",
  openGraph: {
    title: "Brawlers | BrawlLens",
    description: "Every brawler with stats, abilities, and meta context from tracked battles.",
    type: "website",
  },
}

export interface Brawler {
  id: number
  name: string
  imageUrl?: string
  imageUrl2: string
  imageUrl3?: string
  description: string
  rarity: { id: number; name: string; color: string }
  class: { id: number; name: string }
  starPowers: { id: number; name: string; description: string; imageUrl: string }[]
  gadgets: { id: number; name: string; description: string; imageUrl: string }[]
}

export default async function Brawlers() {
  const res = await fetch("https://api.brawlify.com/v1/brawlers", { cache: "no-store" })
  const data = await res.json()
  const brawlers: Brawler[] = data.list ?? []
  return (
    <div className="flex flex-col">
      <Suspense>
        <BrawlerPageClient brawlers={brawlers} />
      </Suspense>
    </div>
  )
}
