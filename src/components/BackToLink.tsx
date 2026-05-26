"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

type BackTarget = {
  href: string
  label: string
  history: boolean
}

type BackToLinkProps = {
  fallbackHref: string
  fallbackLabel: string
  className?: string
}

function readableLabel(pathname: string) {
  if (pathname === "/") return "home"
  if (pathname === "/brawlers") return "tierlist"
  if (pathname.startsWith("/brawlers/")) return "brawler"
  if (pathname === "/meta") return "maps"
  if (pathname.startsWith("/meta/")) return "map"
  if (pathname === "/leaderboards" || pathname.startsWith("/leaderboards/")) return "leaderboards"
  if (pathname.startsWith("/player/")) return "player"
  if (pathname.startsWith("/guides")) return "guides"
  return "previous page"
}

export default function BackToLink({ fallbackHref, fallbackLabel, className = "" }: BackToLinkProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [target, setTarget] = useState<BackTarget>({
    href: fallbackHref,
    label: fallbackLabel,
    history: false,
  })

  useEffect(() => {
    try {
      if (!document.referrer) return
      const referrer = new URL(document.referrer)
      if (referrer.origin !== window.location.origin || referrer.pathname === pathname) return
      setTarget({
        href: `${referrer.pathname}${referrer.search}${referrer.hash}`,
        label: readableLabel(referrer.pathname),
        history: true,
      })
    } catch {
      setTarget({
        href: fallbackHref,
        label: fallbackLabel,
        history: false,
      })
    }
  }, [fallbackHref, fallbackLabel, pathname])

  return (
    <button
      type="button"
      className={`inline-flex h-7 items-center gap-1.5 rounded-[7px] border border-transparent px-1.5 text-[11.5px] font-[780] leading-none text-[rgba(245,244,241,0.74)] transition-colors hover:text-[#f5f4f1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7c5cff] ${className}`}
      onClick={() => {
        if (target.history && window.history.length > 1) {
          router.back()
          return
        }
        router.push(target.href)
      }}
    >
      <ArrowLeft size={13} strokeWidth={2.4} />
      <span>Back to {target.label}</span>
    </button>
  )
}
