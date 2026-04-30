"use client"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"
import { useEffect, type ReactNode } from "react"

function ThemeColorSync() {
  const { resolvedTheme } = useTheme()
  useEffect(() => {
    const color = resolvedTheme === "light" ? "#f7f4ed" : "#f7f4ed"
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null
    if (!meta) {
      meta = document.createElement("meta")
      meta.name = "theme-color"
      document.head.appendChild(meta)
    }
    meta.content = color
  }, [resolvedTheme])
  return null
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <ThemeColorSync />
      {children}
    </NextThemesProvider>
  )
}
