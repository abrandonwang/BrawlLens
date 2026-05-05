import type { Metadata } from "next"
import LoginClient from "./LoginClient"

export const metadata: Metadata = {
  title: "Create Account | BrawlLens",
  description: "Create a BrawlLens account and finish setup through email.",
}

export default function LoginPage() {
  return <LoginClient />
}
