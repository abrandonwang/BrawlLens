"use client"
import { useTheme } from "next-themes"
import NextTopLoader from "nextjs-toploader"

export default function TopLoader() {
  const { resolvedTheme } = useTheme()
  const color = resolvedTheme === "dark" ? "#FFD400" : "#ef4444"

  return <NextTopLoader color={color} showSpinner={false} />
}
