import type { Metadata } from "next"
import DashboardClient from "./dashboard/DashboardClient"

export const metadata: Metadata = {
  title: "Dashboard | BrawlLens",
  description: "A compact BrawlLens dashboard for player lookup, live maps, leaderboard context, and AI prompts.",
  openGraph: {
    title: "Dashboard | BrawlLens",
    description: "Player lookup, meta context, live maps, and leaderboard shortcuts in one polished BrawlLens surface.",
    type: "website",
  },
}

export default function Home() {
  return <DashboardClient />
}
