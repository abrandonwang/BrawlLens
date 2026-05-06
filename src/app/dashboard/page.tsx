import type { Metadata } from "next"
import DashboardClient from "./DashboardClient"

export const metadata: Metadata = {
  title: "Lensboard | BrawlLens",
  description: "A customizable BrawlLens workspace for player lookup, live maps, leaderboard context, and AI prompts.",
  openGraph: {
    title: "Lensboard | BrawlLens",
    description: "Player lookup, meta context, live maps, and leaderboard shortcuts in one customizable BrawlLens surface.",
    type: "website",
  },
}

export default function DashboardPage() {
  return <DashboardClient />
}
