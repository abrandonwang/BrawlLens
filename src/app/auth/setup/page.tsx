import type { Metadata } from "next"
import AuthSetupClient from "./AuthSetupClient"
import DashboardClient from "@/app/dashboard/DashboardClient"

export const metadata: Metadata = {
  title: "Set Up Account - BrawlLens",
  description: "Confirm your BrawlLens account and complete onboarding.",
}

export default function AuthSetupPage() {
  return (
    <>
      <DashboardClient setupMode />
      <AuthSetupClient />
    </>
  )
}
