import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "BrawlLens",
  description: "Brawl Stars brawler, map, player, and leaderboard research.",
  openGraph: {
    title: "BrawlLens",
    description: "Brawl Stars brawler, map, player, and leaderboard research.",
    type: "website",
  },
}

export default function DashboardPage() {
  redirect("/")
}
