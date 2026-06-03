import type { Metadata } from "next"
import { Suspense } from "react"
import AskClient from "./AskClient"

export const metadata: Metadata = {
  title: "Ask BrawlLens AI",
  description: "Ask BrawlLens AI about Brawl Stars players, brawlers, maps, clubs, and the current meta.",
}

export default function AskPage() {
  return (
    <Suspense fallback={<main className="bl-ask-shell min-h-[calc(100dvh-84px)] bg-[#08080c]" />}>
      <AskClient />
    </Suspense>
  )
}
