import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Contact - BrawlLens",
}

export default function ContactPage() {
  redirect("/about#privacy-and-contact")
}
