import type { Metadata } from "next"
import LandingClient from "./LandingClient"

export const metadata: Metadata = {
  title: "BrawlLens",
  description: "Brawl Stars leaderboards, player lookups, brawler stats, and maps.",
  openGraph: {
    title: "BrawlLens",
    description: "Brawl Stars leaderboards, player lookups, brawler stats, and maps.",
    type: "website",
  },
}

export default function Home() {
  return <LandingClient />
}
