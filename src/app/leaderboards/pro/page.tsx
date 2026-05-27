import type { Metadata } from "next"
import ProTeamsClient from "./ProTeamsClient"

export const metadata: Metadata = {
  title: "Pro Teams | BrawlLens",
  description: "Featured competitive Brawl Stars rosters tracked on BrawlLens.",
}

export default function ProTeamsPage() {
  return <ProTeamsClient />
}
