import type { Metadata } from "next"
import { Suspense } from "react"
import MapsPageClient from "./MapsPageClient"
import MapsIndexLoading from "./MapsIndexLoading"

export const metadata: Metadata = {
  title: "Maps - BrawlLens",
  description: "Live map rotation, battle volume by map, mode filters, and per-map brawler win rates from tracked battles.",
  openGraph: {
    title: "Maps - BrawlLens",
    description: "Brawl Stars map and mode meta with live rotation and per-map win rates.",
    type: "website",
  },
}

export default function MetaPage() {
  return (
    <div className="">
      <Suspense fallback={<MapsIndexLoading />}>
        <MapsPageClient />
      </Suspense>
    </div>
  )
}
