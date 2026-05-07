"use client"

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crown,
  Search,
  Trophy,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { BrawlImage, brawlerIconUrl } from "@/components/BrawlImage"

export type LeaderboardKind = "players" | "clubs" | "brawlers"

export type FeatureCard = {
  title: string
  detail: string
  flagCode?: string
  flagLabel?: string
  href?: string
  region?: string
  accent?: string
  logoUrl?: string
  logoFilter?: string
  logoBgFilter?: string
  logoBgOpacity?: string
  logoBgFit?: string
  logoBgPosition?: string
  logoBgSize?: string
  logoBgTop?: string
  logoBlendMode?: string
  logoSurface?: string
}

export const professionalTeamCards: FeatureCard[] = [
  {
    title: "Crazy Raccoons",
    detail: "Moya · Tensai · Milkreo",
    flagCode: "jp",
    flagLabel: "Japan",
    accent: "#e43747",
    logoUrl: "/team-logos/crazy-raccoons.webp",
    logoBgFilter: "contrast(2.15) brightness(1.12) saturate(1.25)",
    logoBgOpacity: "0.64",
    logoBgFit: "cover",
    logoBgPosition: "center",
    logoBgSize: "330px",
    logoBgTop: "-96px",
    logoBlendMode: "screen",
  },
  {
    title: "HMBLE",
    detail: "Symantec · Lukii · BosS",
    flagCode: "it",
    flagLabel: "Italy",
    accent: "#8ad7ff",
    logoUrl: "https://hmble.it/images/logo/hmble-logo.png",
    logoFilter: "brightness(0) invert(1)",
    logoBgOpacity: "0.36",
    logoBgPosition: "center 42%",
  },
  {
    title: "ZETA",
    detail: "Sitetampo · Sizuku · Batman",
    flagCode: "jp",
    flagLabel: "Japan",
    accent: "#d8d1ff",
    logoUrl: "/team-logos/zeta.png",
    logoBgOpacity: "0.54",
    logoBgFit: "contain",
    logoBgPosition: "center",
    logoBgTop: "-76px",
    logoBlendMode: "screen",
  },
  {
    title: "SK Gaming",
    detail: "Yoshi · Ope · Nowy297",
    flagCode: "de",
    flagLabel: "Germany",
    accent: "#ff9f6e",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/c/cc/SK_Gaming_Logo_2022.svg",
    logoFilter: "brightness(0) invert(1)",
    logoBgOpacity: "0.30",
    logoBgPosition: "center",
    logoBgSize: "154px",
    logoBgTop: "-8px",
  },
]

const tabs = [
  { key: "players", label: "Players", href: "/leaderboards/players" },
  { key: "clubs", label: "Clubs", href: "/leaderboards/clubs" },
  { key: "brawlers", label: "Brawlers", href: "/leaderboards/brawlers" },
  { key: "community", label: "Community" },
] as const

const regionShort: Record<string, string> = {
  global: "ALL",
  US: "US",
  KR: "KR",
  BR: "BR",
  DE: "DE",
  JP: "JP",
}

export function regionCode(code: string) {
  return regionShort[code] ?? code.slice(0, 2).toUpperCase()
}

function teamSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

export function LeaderboardPageShell({
  active,
  children,
}: {
  active: LeaderboardKind
  children: ReactNode
}) {
  return (
    <main className="bl-lb-shell">
      <LeaderboardTabs active={active} />
      <div className="bl-lb-frame">
        {children}
      </div>
    </main>
  )
}

export function LeaderboardTabs({ active }: { active: LeaderboardKind }) {
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

  return (
    <div ref={slotRef} className={`bl-lb-subnav-slot ${isStuck ? "bl-lb-subnav-slot-stuck" : ""}`}>
      <div className="bl-lb-subnav-wrap">
        <nav aria-label="Leaderboard sections" className="bl-lb-subnav">
          {tabs.map(tab => {
            const isActive = tab.key === active
            const className = `bl-lb-tab ${isActive ? "bl-lb-tab-active" : ""} ${tab.key === "community" ? "bl-lb-tab-disabled" : ""}`
            const inner = <span>{tab.label}</span>

            if ("href" in tab) {
              return (
                <Link key={tab.key} href={tab.href} className={className}>
                  {inner}
                </Link>
              )
            }

            return (
              <span key={tab.key} className={className} aria-disabled="true">
                {inner}
              </span>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

export function FeatureCardRail({ cards }: { cards: FeatureCard[] }) {
  return (
    <section aria-label="Professional teams" className="bl-lb-team-rail">
      {cards.map((card, index) => {
        const accent = card.accent ?? "#f2d36b"
        const style = {
          "--team-accent": accent,
          "--team-logo-filter": card.logoFilter ?? "none",
          "--team-logo-bg-filter": card.logoBgFilter ?? card.logoFilter ?? "none",
          "--team-logo-bg-opacity": card.logoBgOpacity ?? "0.08",
          "--team-logo-bg-fit": card.logoBgFit ?? "contain",
          "--team-logo-bg-position": card.logoBgPosition ?? "center",
          "--team-logo-bg-size": card.logoBgSize ?? "282px",
          "--team-logo-bg-top": card.logoBgTop ?? "-52px",
          "--team-logo-bg-blend-mode": card.logoBlendMode ?? "normal",
          "--team-logo-surface": card.logoSurface ?? "rgba(4,5,8,0.52)",
        } as CSSProperties
        const body = (
          <div className="bl-lb-team-card" data-team={teamSlug(card.title)} style={style}>
            {card.logoUrl && (
              <img
                src={card.logoUrl}
                alt=""
                className="bl-lb-team-logo-bg"
                loading="lazy"
                decoding="async"
                onError={event => { event.currentTarget.style.display = "none" }}
              />
            )}
            <div className="bl-lb-team-copy">
              <div className="bl-lb-team-row">
                {card.flagCode && (
                  <span
                    className={`bl-lb-team-flag bl-lb-team-flag-${card.flagCode}`}
                    aria-label={card.flagLabel ?? card.flagCode}
                  />
                )}
                <span className="bl-lb-team-name">{card.title}</span>
                <ChevronRight className="bl-lb-team-arrow" aria-hidden="true" size={14} strokeWidth={2.8} />
              </div>
              <span className="bl-lb-team-detail">{card.detail}</span>
            </div>
          </div>
        )

        if (card.href) {
          return (
            <Link key={`${card.title}-${index}`} href={card.href} className="bl-lb-team-link">
              {body}
            </Link>
          )
        }

        return <div key={`${card.title}-${index}`}>{body}</div>
      })}
    </section>
  )
}

export function LeaderboardBoard({ children }: { children: ReactNode }) {
  return (
    <section className="bl-lb-board">
      {children}
    </section>
  )
}

export function LeaderboardHero({
  title,
  description,
  imageId,
  eyebrow,
  meta,
}: {
  title: string
  description?: string
  imageId?: number
  eyebrow?: string
  meta?: ReactNode
}) {
  return (
    <section className="bl-lb-hero">
      <div className="bl-lb-hero-copy">
        {eyebrow && <span className="bl-lb-eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <div className="bl-lb-hero-side" aria-hidden={!meta && !imageId}>
        {imageId && (
          <span className="bl-lb-hero-icon">
            <BrawlImage
              src={brawlerIconUrl(imageId)}
              alt=""
              width={72}
              height={72}
              className="bl-lb-hero-brawler"
              sizes="72px"
            />
          </span>
        )}
        {meta && <div className="bl-lb-hero-meta">{meta}</div>}
      </div>
    </section>
  )
}

export function LeaderboardToolbar({ children }: { children: ReactNode }) {
  return (
    <section className="bl-lb-toolbar">
      {children}
    </section>
  )
}

export function LeaderboardPanel({ children }: { children: ReactNode }) {
  return (
    <section className="bl-lb-panel">
      {children}
    </section>
  )
}

export function RegionPills({
  regions,
  activeRegion,
  onChange,
}: {
  regions: { code: string; label: string }[]
  activeRegion: string
  onChange: (code: string) => void
}) {
  return (
    <div className="bl-lb-region-pills">
      {regions.map(region => {
        const isActive = region.code === activeRegion
        return (
          <button
            key={region.code}
            type="button"
            onClick={() => onChange(region.code)}
            className={`bl-lb-region-pill ${isActive ? "bl-lb-region-pill-active" : ""}`}
            aria-pressed={isActive}
            title={region.label}
          >
            <span>{regionCode(region.code)}</span>
          </button>
        )
      })}
    </div>
  )
}

export function RegionSelect({
  regions,
  activeRegion,
  onChange,
}: {
  regions: { code: string; label: string }[]
  activeRegion: string
  onChange: (code: string) => void
}) {
  return (
    <label className="bl-lb-select">
      <span>Region</span>
      <select aria-label="Region" value={activeRegion} onChange={event => onChange(event.target.value)}>
        {regions.map(region => (
          <option key={region.code} value={region.code}>{region.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className="bl-lb-select-icon" />
    </label>
  )
}

export function SearchBox({
  value,
  onChange,
  placeholder,
  name = "leaderboard-search",
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  name?: string
}) {
  return (
    <label className="bl-lb-search">
      <Search size={15} strokeWidth={2.25} />
      <input
        name={name}
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  )
}

export function SummaryStrip({ stats }: { stats: { label: string; value: string; icon?: LucideIcon }[] }) {
  return (
    <section className="bl-lb-summary">
      {stats.map(stat => {
        const Icon = stat.icon ?? Crown
        return (
          <div key={stat.label} className="bl-lb-summary-card">
            <Icon size={15} strokeWidth={2.25} />
            <span>{stat.label}</span>
            <strong suppressHydrationWarning>{stat.value}</strong>
          </div>
        )
      })}
    </section>
  )
}

export function SignalStrip({
  items,
}: {
  items: { label: string; value: string; icon?: LucideIcon; imageId?: number }[]
}) {
  return (
    <div className="bl-lb-signal-strip">
      {items.map(item => {
        const Icon = item.icon ?? Trophy
        return (
          <div key={item.label} className="bl-lb-signal">
            {item.imageId ? (
              <BrawlImage src={brawlerIconUrl(item.imageId)} alt="" width={24} height={24} className="bl-lb-signal-image" sizes="24px" />
            ) : (
              <Icon size={15} strokeWidth={2.25} />
            )}
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        )
      })}
    </div>
  )
}

export function ModeControls() {
  return (
    <div className="bl-lb-mode-note">
      <Trophy size={14} strokeWidth={2.2} />
      <span>Ranked snapshot</span>
    </div>
  )
}

export function TableHead({
  children,
  className,
}: {
  children: ReactNode
  className: string
}) {
  return (
    <div className={`bl-lb-table-head ${className}`}>
      {children}
    </div>
  )
}

export function RankCell({ rank }: { rank: number }) {
  return (
    <span className={`bl-lb-rank bl-lb-rank-${rank <= 3 ? rank : "default"}`}>
      {rank}
    </span>
  )
}

export function TrophyMetric({
  value,
  compact = false,
}: {
  value: string
  compact?: boolean
}) {
  return (
    <div className={`bl-lb-trophy-metric ${compact ? "bl-lb-trophy-metric-compact" : ""}`}>
      <Trophy size={compact ? 18 : 30} strokeWidth={2.25} />
      <strong>{value}</strong>
    </div>
  )
}

export function EmptyLeaderboardState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <section className="bl-lb-empty">
      <h2>{title}</h2>
      <p>{description}</p>
      {action && <div>{action}</div>}
    </section>
  )
}

export function Pager({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  return (
    <nav className="bl-lb-pager" aria-label="Leaderboard pages">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
        aria-label="Previous page"
      >
        <ChevronLeft size={15} />
      </button>
      {Array.from({ length: totalPages }, (_, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onChange(idx)}
          className={idx === page ? "bl-lb-page-active" : ""}
          aria-current={idx === page ? "page" : undefined}
        >
          {idx + 1}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages - 1}
        aria-label="Next page"
      >
        <ChevronRight size={15} />
      </button>
    </nav>
  )
}
