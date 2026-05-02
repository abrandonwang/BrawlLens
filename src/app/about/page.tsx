import type { Metadata } from "next"
import { AboutContent } from "@/components/InfoPageContent"

export const metadata: Metadata = {
  title: "About | BrawlLens",
  description: "How BrawlLens computes win rates, rankings, and meta scores. Documentation, data sources, and contact.",
  openGraph: {
    title: "About | BrawlLens",
    description: "How BrawlLens computes its stats. Data sources and methodology.",
    type: "article",
  },
}

export default function AboutPage() {
  return <AboutContent />
}
