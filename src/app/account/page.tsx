import type { Metadata } from "next"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { AUTH_ACCESS_COOKIE, AUTH_REFRESH_COOKIE } from "@/lib/authCookies"
import AccountClient from "./AccountClient"

export const metadata: Metadata = {
  title: "Account - BrawlLens",
  description: "Manage BrawlLens account, premium, billing, cancellation, and privacy settings.",
}

export default async function AccountPage() {
  const cookieStore = await cookies()
  if (!cookieStore.has(AUTH_ACCESS_COOKIE) && !cookieStore.has(AUTH_REFRESH_COOKIE)) redirect("/?auth=login&next=/account")

  return <AccountClient />
}
