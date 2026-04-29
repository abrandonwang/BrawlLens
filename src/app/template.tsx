"use client"

import { usePathname } from "next/navigation"

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname.startsWith("/chat")) return <>{children}</>

  return <div className="page-transition">{children}</div>
}
