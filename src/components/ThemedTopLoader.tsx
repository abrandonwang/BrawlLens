"use client"
import { useTheme } from "next-themes"
import NextTopLoader from "nextjs-toploader"

export default function ThemedTopLoader() {
  const { resolvedTheme } = useTheme()
  return (
    <NextTopLoader
      color={resolvedTheme === "dark" ? "#FFD400" : "#ef4444"}
      showSpinner={false}
    />
  )
}
