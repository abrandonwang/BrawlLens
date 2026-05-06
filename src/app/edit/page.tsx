import type { Metadata } from "next"
import DashboardClient from "@/app/dashboard/DashboardClient"

export const metadata: Metadata = {
  title: "Edit Lensboard | BrawlLens",
  description: "Arrange saved BrawlLens panels on a personal 10x10 Lensboard.",
  openGraph: {
    title: "Edit Lensboard | BrawlLens",
    description: "Choose panel presets, place them on a 10x10 board, and save the layout to your BrawlLens account.",
    type: "website",
  },
}

export default function EditPage() {
  return <DashboardClient editable showIntro={false} />
}
