import Link from "next/link"
import type { ReactNode } from "react"
import { BrawlImage } from "@/components/BrawlImage"
import HelpTooltip from "@/components/HelpTooltip"
import { winRateColor } from "@/lib/tiers"
import type { GuideBrawler, GuideMap } from "@/lib/guideData"

export const guideLinks = [
  { href: "/guides", label: "Guide Hub" },
  { href: "/guides/progression", label: "Progression" },
  { href: "/guides/brawlers", label: "Brawlers" },
  { href: "/guides/maps", label: "Maps" },
] as const

export function GuideShell({ children }: { children: ReactNode }) {
  return (
    <main className="bl-guide-shell">
      <nav className="bl-guide-tabs" aria-label="Guide sections">
        {guideLinks.map(link => (
          <Link key={link.href} href={link.href}>{link.label}</Link>
        ))}
      </nav>
      {children}
    </main>
  )
}

export function GuideHero({
  title,
  description,
  meta,
}: {
  title: string
  description: string
  meta?: ReactNode
}) {
  return (
    <section className="bl-guide-hero">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {meta && <div className="bl-guide-hero-meta">{meta}</div>}
    </section>
  )
}

export function GuideMetric({ label, value, help }: { label: string; value: string; help: string }) {
  return (
    <div className="bl-guide-metric">
      <span className="bl-help-label">
        <span>{label}</span>
        <HelpTooltip label={`${label} explained`}>
          {help}
        </HelpTooltip>
      </span>
      <strong>{value}</strong>
    </div>
  )
}

export function GuideSection({
  title,
  help,
  children,
}: {
  title: string
  help?: string
  children: ReactNode
}) {
  return (
    <section className="bl-guide-section">
      <h2>
        <span>{title}</span>
        {help && (
          <HelpTooltip label={`${title} explained`} align="left">
            {help}
          </HelpTooltip>
        )}
      </h2>
      {children}
    </section>
  )
}

export function BrawlerGuideRow({
  brawler,
  rank,
  label,
}: {
  brawler: GuideBrawler
  rank: number
  label?: string
}) {
  return (
    <Link href={`/brawlers/${brawler.id}`} className="bl-guide-brawler-row">
      <span className="bl-guide-rank">{rank}</span>
      <BrawlImage src={brawler.imageUrl} alt={brawler.name} width={42} height={42} className="bl-guide-brawler-icon" sizes="42px" />
      <span className="bl-guide-brawler-copy">
        <strong>{formatBrawlerName(brawler.name)}</strong>
        <small>{label ?? `${brawler.role} · ${brawler.rarity}`}</small>
      </span>
      <span className="bl-guide-number" style={{ color: winRateColor(brawler.winRate) }}>{formatPercent(brawler.winRate)}</span>
      <span className="bl-guide-muted">{formatNumber(brawler.picks)} games</span>
    </Link>
  )
}

export function MapGuideRow({ map, rank }: { map: GuideMap; rank: number }) {
  return (
    <Link href={`/meta/${encodeURIComponent(map.name)}`} className="bl-guide-map-row">
      <span className="bl-guide-rank">{rank}</span>
      <span className="bl-guide-brawler-copy">
        <strong>{map.name}</strong>
        <small>{map.mode}</small>
      </span>
      <span className="bl-guide-number">{formatNumber(map.battles)}</span>
      <span className="bl-guide-muted">battles</span>
    </Link>
  )
}

export function formatNumber(value: number) {
  return Math.round(value).toLocaleString("en-US")
}

export function formatPercent(value: number, digits = 1) {
  return `${value.toFixed(digits)}%`
}

export function formatBrawlerName(name: string) {
  return name
    .split(" ")
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ")
}
