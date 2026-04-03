"use client"
import { useTheme } from "next-themes"
import NextTopLoader from "nextjs-toploader"
import { useEffect, useState } from "react"

export default function ThemedTopLoader() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return (
    <NextTopLoader
      color={mounted && resolvedTheme === "dark" ? "#FFD400" : "#ef4444"}
      showSpinner={false}
    />
  )
}
