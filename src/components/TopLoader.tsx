"use client"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import NextTopLoader from "nextjs-toploader"

export default function TopLoader() {
  const { resolvedTheme } = useTheme()
  const [color, setColor] = useState("#ef4444")

  useEffect(() => {
    setColor(resolvedTheme === "dark" ? "#FFD400" : "#ef4444")
  }, [resolvedTheme])

  return <NextTopLoader color={color} showSpinner={false} />
}
