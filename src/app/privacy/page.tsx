import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Privacy - BrawlLens",
}

export default function PrivacyPage() {
  redirect("/about#privacy-and-contact")
}
