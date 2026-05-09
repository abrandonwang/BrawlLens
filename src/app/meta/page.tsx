import type { Metadata } from "next"
import { Suspense } from "react"
import MapsPageClient from "./MapsPageClient"

export const metadata: Metadata = {
  title: "Maps & Meta - BrawlLens",
  description: "Live map rotation, battle volume by map, mode filters, and per-map brawler win rates from tracked battles.",
  openGraph: {
    title: "Maps & Meta - BrawlLens",
    description: "Brawl Stars map and mode meta with live rotation and per-map win rates.",
    type: "website",
  },
}

export default function MetaPage() {
  return (
    <div className="">
      <Suspense>
        <MapsPageClient />
      </Suspense>
    </div>
  )
}
