import type { Metadata } from "next"
import type { ReactNode } from "react"
import GuideNav from "./GuideNav"

export const metadata: Metadata = {
  title: "Guides - BrawlLens",
  description: "BrawlLens documentation-style guides for progression, brawlers, maps, and data interpretation.",
}

export default function GuidesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bl-doc-frame">
      <GuideNav />
      <div className="bl-doc-content">
        {children}
      </div>
    </div>
  )
}
