import type { Metadata } from "next"
import ChatPageClient from "./ChatPageClient"

export const metadata: Metadata = {
  title: "Ask AI — BrawlLens",
  description: "Ask plain-language questions about Brawl Stars players, brawlers, maps, rankings, and matchups.",
  openGraph: {
    title: "Ask AI — BrawlLens",
    description: "Ask anything about Brawl Stars data.",
    type: "website",
  },
}

export default function ChatPage() {
  return <ChatPageClient />
}
