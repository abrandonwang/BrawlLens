import type { Metadata } from "next"
import AuthCallbackClient from "./AuthCallbackClient"

export const metadata: Metadata = {
  title: "Signing in - BrawlLens",
}

export default function AuthCallbackPage() {
  return <AuthCallbackClient />
}
