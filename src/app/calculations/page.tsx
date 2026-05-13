import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Calculations - BrawlLens",
}

export default function CalculationsPage() {
  redirect("/about#metric-rules")
}
