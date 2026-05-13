import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Leaderboards - BrawlLens",
}

export default function LeaderboardsPage() {
  redirect("/leaderboards/players")
}
