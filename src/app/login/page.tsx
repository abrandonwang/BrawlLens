import type { Metadata } from "next"
import { Suspense } from "react"
import LoginClient from "./LoginClient"

export const metadata: Metadata = {
  title: "Account - BrawlLens",
  description: "Create or log in to a BrawlLens account.",
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginClient />
    </Suspense>
  )
}
