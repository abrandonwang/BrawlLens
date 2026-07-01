"use client"

import { useEffect, useState, type CSSProperties } from "react"
import Link from "next/link"
import { PulsingBorder } from "@paper-design/shaders-react"
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

const HERO_BORDER_COLORS = ["#FF6B6B", "#5aeed0", "#ff6099", "#f5d75e", "#FF6B6B"]
const HERO_BORDER_STYLE: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 3,
  boxSizing: "border-box",
  width: "100%",
  height: "100%",
  borderRadius: "inherit",
  pointerEvents: "none",
  opacity: 0.88,
}

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
  // Defer mounting the shader to keep first paint cheap, mirroring the tier list.
  const [shaderReady, setShaderReady] = useState(false)
  useEffect(() => {
    const id = window.requestIdleCallback?.(() => setShaderReady(true)) ?? window.setTimeout(() => setShaderReady(true), 120)
    return () => {
      if (typeof id === "number") window.clearTimeout(id)
      else window.cancelIdleCallback?.(id as unknown as number)
    }
  }, [])

  const encodedTag = encodeURIComponent(tag)

  return (
    <section className="bl-profile-hero-card" aria-label="Player overview">
      {shaderReady && (
        <PulsingBorder
          aria-hidden="true"
          className="bl-profile-hero-shader"
          style={HERO_BORDER_STYLE}
          colors={HERO_BORDER_COLORS}
          colorBack="#00000000"
          roundness={0.08}
          thickness={0.08}
          softness={0.72}
          intensity={0.22}
          bloom={0.22}
          spots={5}
          spotSize={0.48}
          pulse={0.22}
          smoke={0.28}
          smokeSize={0.64}
          speed={0.82}
          scale={1}
        />
      )}

      <div className="bl-profile-hero-card-inner">
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
              <Link href={`/player/${encodedTag}`} className="bl-profile-refresh" prefetch={false}>
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
  )
}
