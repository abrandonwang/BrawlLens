import type { Metadata } from "next"
import { AboutContent } from "@/components/InfoPageContent"

export const metadata: Metadata = {
  title: "About - BrawlLens",
  description: "BrawlLens reference for tracked pages, metric rules, data freshness, privacy, and contact.",
  openGraph: {
    title: "About - BrawlLens",
    description: "Formulas, data notes, and methodology for BrawlLens.",
    type: "article",
  },
}

export default function AboutPage() {
  return <AboutContent />
}
