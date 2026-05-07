import type { Metadata } from "next"
import LandingClient from "./LandingClient"

export const metadata: Metadata = {
  title: "BrawlLens - Clean Brawl Stars analytics",
  description: "A quiet workspace for Brawl Stars leaderboards, player lookups, brawler trends, and map meta.",
  openGraph: {
    title: "BrawlLens - Clean Brawl Stars analytics",
    description: "A quiet workspace for Brawl Stars leaderboards, player lookups, brawler trends, and map meta.",
    type: "website",
  },
}

export default function Home() {
  return <LandingClient />
}
