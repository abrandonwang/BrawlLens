import type { Metadata } from "next"
import AuthCallbackClient from "./AuthCallbackClient"

export const metadata: Metadata = {
  title: "Signing In - BrawlLens",
}

export default function AuthCallbackPage() {
  return <AuthCallbackClient />
}
