import { Suspense } from "react"
import BrawlerPageClient from "./BrawlerPageClient"

export interface Brawler {
  id: number
  name: string
  imageUrl2: string
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
