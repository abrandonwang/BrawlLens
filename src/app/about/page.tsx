import type { Metadata } from "next"
import { AboutContent } from "@/components/InfoPageContent"

export const metadata: Metadata = {
  title: "Data Reference - BrawlLens",
  description: "Compact BrawlLens reference for tracked surfaces, metric rules, data freshness, privacy, and contact.",
  openGraph: {
    title: "Data Reference - BrawlLens",
    description: "Compact formulas, data notes, and methodology for BrawlLens.",
    type: "article",
  },
}

export default function AboutPage() {
  return <AboutContent />
}
