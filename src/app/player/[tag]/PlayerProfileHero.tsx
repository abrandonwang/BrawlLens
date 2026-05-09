"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { BrawlImage } from "@/components/BrawlImage"

type PlayerProfileHeroProps = {
  name: string
  tag: string
  prestigeLevel: number
  regionLabel: string
  iconId?: number
  activeTab?: "overview" | "brawlers"
}

const tabs = [
  { tab: "overview", label: "Overview" },
  { tab: "brawlers", label: "Brawlers" },
] as const

function firstGlyph(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "#"
}

function profileIconUrl(id: number) {
  return `https://cdn.brawlify.com/profile-icons/regular/${id}.png`
}

export default function PlayerProfileHero({
  name,
  tag,
  prestigeLevel,
  regionLabel,
  iconId,
  activeTab = "overview",
}: PlayerProfileHeroProps) {
  const slotRef = useRef<HTMLDivElement | null>(null)
  const [isStuck, setIsStuck] = useState(false)

  useEffect(() => {
    let frame = 0

    const updateStuckState = () => {
      frame = 0
      const slotTop = slotRef.current?.getBoundingClientRect().top ?? 1
      setIsStuck(current => {
        const next = slotTop <= 0
        return current === next ? current : next
      })
    }

    const requestUpdate = () => {
      if (frame) return
      frame = window.requestAnimationFrame(updateStuckState)
    }

    updateStuckState()
    window.addEventListener("scroll", requestUpdate, { passive: true })
    window.addEventListener("resize", requestUpdate)

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener("scroll", requestUpdate)
      window.removeEventListener("resize", requestUpdate)
    }
  }, [])

  const encodedTag = encodeURIComponent(tag)

  return (
    <div ref={slotRef} className={`bl-profile-hero-slot ${isStuck ? "bl-profile-hero-slot-stuck" : ""}`}>
      <section className="bl-profile-hero">
        <div className="bl-profile-hero-inner">
          <div className="bl-profile-identity">
            <div className="bl-profile-avatar-wrap">
              <span className="bl-profile-avatar">
                {iconId ? (
                  <BrawlImage src={profileIconUrl(iconId)} alt="" width={76} height={76} sizes="76px" />
                ) : firstGlyph(name)}
              </span>
              <span className="bl-profile-level">{prestigeLevel}</span>
            </div>

            <div className="bl-profile-title">
              <h1>
                <span className="bl-profile-name">{name}</span>
                <span className="bl-profile-tag">#{tag}</span>
                <span className="bl-profile-region">{regionLabel}</span>
              </h1>
              <div className="bl-profile-actions">
                <Link href={`/player/${encodeURIComponent(tag)}`} className="bl-profile-refresh" prefetch={false}>
                  <span />
                  Update now
                </Link>
              </div>
            </div>
          </div>

          <nav className="bl-profile-tabs" aria-label="Player profile sections">
            {tabs.map(tab => (
              <Link
                key={tab.tab}
                href={tab.tab === "overview" ? `/player/${encodedTag}` : `/player/${encodedTag}/brawlers`}
                className={`bl-profile-tab ${activeTab === tab.tab ? "bl-profile-tab-active" : ""}`}
                prefetch={false}
              >
                <span>{tab.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </section>
    </div>
  )
}
